import { tryParse } from "../../Database";
import client from "../../../bot";
import { globalKnex } from "../../db";
import { QueryBuilder } from "knex";
import { callEventInternal, EventContent } from "./event_eval";
import { reportError } from "./report_error";

/*
notes:
- we only get one try. if we call the event and the message doesn't go out, too bad.
*/

const ourk = (): QueryBuilder<DBEvent, DBEvent[]> => globalKnex!<DBEvent, DBEvent[]>("timed_events_at2");

export interface TimedEvent extends TimedEventExclSearch {
    // search can be used to for instance:
    // - find all my upcoming remindme s to cancel a specific one
    // - find a delete request for a specified message and cancel it
    search: string;
}
export type TimedEventExclSearch = {
    for_guild: string,
    content: EventContent,
};

type DBEvent = {
    id: number,
    for_guild: string,
    time: `${number}`,
    event: string, // EventContent
    completed: boolean,

    created_time: null | `${string}`,
    started_at_time: null | `${string}`,
    completed_at_time: null | `${string}`,
    status: null | "NEW" | "LOAD" | "SUCCESS" | "ERROR" | "unsupported", // MAX LEN 10
    error_id: null | number,
    search: null | string, // MAX LEN 100
};

//* if we find an event but it's more than 2,147,483,647ms in the future:
// - setTimeout(that long)

let next_event_timeout: {njst: NodeJS.Timeout, time: number} | null = null;

//! always queue events for a guild that your shard is on. never queue events for a different guild.
export async function queueEvent(event: TimedEvent, from_now_ms: number): Promise<void> {
    if(from_now_ms < 10_000) {
        setTimeout(() => callEvent(null, event), from_now_ms);
        return;
    }

    if(event.search.length > 100) throw new Error("search string too long"); // postgres counts codepoints
    // i think so this isn't quite right but it should never not error when it won't fit
    // *! consider hashing the search string to remove the 100 character limit.

    /*
		t.increments("id")
			.notNull()
			.primary();
        t.string("for_guild").notNull();
		t.bigInteger("time").notNull();
		t.json("event").notNull();
		t.boolean("completed").notNull();
    */
    const next_event_time = Date.now() + from_now_ms;
    const insert_res = await ourk().insert({
        for_guild: event.for_guild,
        time: `${(next_event_time)}`,
        event: JSON.stringify(event.content),
        completed: false,

        created_time: `${Date.now()}`,
        started_at_time: null,
        completed_at_time: null,
        status: "NEW",
        error_id: null,
        search: event.search,
    });
    await updateNextEvent(next_event_time);
}

// async function cancelEventBySearch(search: string)
// : cancels all events that equal the search string

// do a db fetch and update known_next_event
export async function updateNextEvent(nxtvt: number): Promise<void> {
    if(next_event_timeout != null && nxtvt !== -1 && nxtvt > next_event_timeout.time) {
        return;
    }

    const all_guilds = [...client.guilds.cache.values()].map(g => g.id); // can't use .keys for some reason

    // this is a pretty big 'whereIn' list. should never be more than 2000 items though.
    // especially for a .limit(1) query, wow
    const next_event = await ourk().where({
        'completed': false,
    }).whereIn("for_guild", [...all_guilds]).orderBy('time', "asc").select("*").limit(1).first();
    
    if(next_event == null) return;
    
    const event_time = +next_event.time;
    const ms_until_event = event_time - Date.now();

    if(next_event_timeout != null) {
        clearTimeout(next_event_timeout.njst);
        next_event_timeout = null;
    }

    if(ms_until_event < 0) {
        console.log("[TEat2] backlogged event");
        await markCompletedThenCallDBEvent(next_event);
        return await updateNextEvent(event_time);
    }
    if(ms_until_event > 2_000_000_000) { // near the 32 bit integer limit timeouts have
        next_event_timeout = {njst: setTimeout(() => {
            next_event_timeout = null;
            updateNextEvent(event_time).catch(e => console.log("[TEat2] timeout updatenextevent failure", e));
        }, 2_000_000_000), time: event_time};
        return;
    }

    next_event_timeout = {njst: setTimeout(() => {
        next_event_timeout = null;
        (async () => {
            await markCompletedThenCallDBEvent(next_event);
            await updateNextEvent(event_time);
        })().catch(e => {
            console.log("[TEat2] complete failure", e);
        });
    }, ms_until_event), time: event_time};
    // tryParse<TimedEvent>()
}

export function initializeTimedEvents(): void {
    updateNextEvent(-1).catch(e => {
        console.log("[TEat2] initialize error", e);
    });
}

// to start a timeout:
// - if longer than 2,147,483,647ms:
// let ms_remaining = …
// if(ms_remaining > 2,147,483,647) {
//    setTimeout(this again)
// }else{
//    setTimeout(do the event)
// }

async function markCompletedThenCallDBEvent(db_ev: DBEvent) {
    const ev_content = tryParse<EventContent>(db_ev.event, {
        kind: "corrupted",
    });

    // mark the event completed
    // ideally, we would do this after triggering the call
    // but we can't because of the potential race conditoin of the thing getting
    // updated by this after getting updated by the other thing
    await ourk().where({
        id: db_ev.id,
    }).update({
        completed: true,

        status: "LOAD",
        started_at_time: `${Date.now()}`,
    });

    // async start calling the event. *do not error*
    callEvent(db_ev.id, {for_guild: db_ev.for_guild, content: ev_content});
}

export function callEvent(ev_id: null | number, event: TimedEventExclSearch): void {
    // TODO: note that the event is completed, for average event completion time stats
    // we can note as
    // - in_progress
    // - completed
    // - errored
    // note that we will never automatically retry any events
    callEventInternal(event).then(r => {
        if(ev_id != null) ourk().where({
            id: ev_id,
        }).update({
            status: "SUCCESS",
            completed_at_time: `${Date.now()}`,
        }).catch(em => {
            // failed to mark event as an error event
            // funny
            console.log('[TEat2] failed to mark event as a success.', em);
        });
    }).catch(e => {
        console.log("[TEat2] callEventInternal error", e);
        reportError(event.for_guild, "TEat2", e, event);
        // oh reporterror can't give us the error id in a callback or something, unfortunate

        if(ev_id != null) ourk().where({
            id: ev_id,
        }).update({
            status: "ERROR",
            completed_at_time: `${Date.now()}`,
        }).catch(em => {
            // failed to mark event as an error event
            // funny
            console.log('[TEat2] failed to mark event as an error. ironic.', em);
        });
    });
}

// 30, 15, 30, 30