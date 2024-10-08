import * as nr from "../NewRouter";
import Info from "../Info";
import { promises as fs } from "fs";
import * as path from "path";
import { stripMentions } from "./channelmanagement";
import { safe } from "../../messages";
import { ActionRowBuilder, TextChannel } from "discord.js";
import Database from "../Database";

nr.globalCommand(
	"/help/test/test",
	"test",
	{
		usage: "test",
		description: "Test the bot",
		examples: [],
		perms: {},
	},
	nr.list(),
	async ([], info) => {
		await info.success(
			`it works! This is the default webpage for this web server.`,
		);
	},
);

nr.globalCommand(
	"/help/test/success",
	"success",
	{
		usage: "success",
		description:
			"{Emoji|success} succeed. Note that success may return failure if it is passed any arguments.",
		examples: [],
		perms: {},
	},
	nr.list(),
	async ([], info) => {
		await info.success(`success`);
	},
);

nr.globalCommand(
	"/help/test/error",
	"error",
	{
		usage: "error",
		description: "{Emoji|failure} Error :(",
		examples: [],
		perms: {},
	},
	nr.list(),
	async ([], info) => {
		await info.error(`failure`);
	},
);

nr.globalCommand(
	"/help/test/warn",
	"warn",
	{
		usage: "warn",
		description: "{Emoji|warning} warn :(",
		examples: [],
		perms: {},
	},
	nr.list(),
	async ([], info) => {
		await info.warn(`warning`);
	},
);

nr.globalCommand(
	"/help/test/warn/eventually",
	"warn eventually",
	{
		usage: "warn eventually",
		description: "{Emoji|warning} warn :(",
		examples: [],
		perms: {},
	},
	nr.list(),
	async ([], info) => {
		await info.typing();
		await new Promise(r => setTimeout(r, 5000));
		await info.warn(`warning`);
	},
);

nr.globalCommand(
	"/help/test/crash",
	"crash",
	{
		usage: "crash",
		description: "Crash the bot",
		examples: [
			{
				in: `ip!crash`,
				out: `@you, {Emoji|failure} An internal error occured while running this command. Error code: {Code|8oywx5uxsi}`,
			},
		],
		perms: {},
	},
	nr.list(),
	async ([]) => {
		throw new Error("Crash command used");
	},
);

nr.globalCommand(
	"/help/owner/restart",
	"restart",
	{
		usage: "restart",
		description: "restart the shard",
		examples: [],
		perms: { runner: ["bot_owner"] },
	},
	nr.list(),
	async ([], info) => {
		const msg = (await info.message.channel.send(
			"<a:loading:682804438783492139> Restarting...",
		));
		await fs.writeFile(
			path.join(process.cwd(), ".restarting"),
			msg.channel + ":" + msg.id + ":" + new Date().getTime(),
			"utf-8",
		);
		process.exit(0);
	},
);

nr.globalCommand(
	"/help/owner/setautodeletelimit",
	"setautodeletelimit",
	{
		usage: "setautodeletelimit [guild_id] [new_limit]",
		description: "setautodeletelimit",
		examples: [],
		perms: { runner: ["bot_owner"] },
	},
	nr.list(nr.a.word(), nr.a.number()),
	async ([guild_id, new_limit], info) => {
		const db_v = new Database(guild_id);
		await db_v.getOrLoadData();
		const old_limit = await db_v.getAutodeleteLimit();
		await db_v.setAutodeleteLimit(new_limit);
		return await info.success("Autodelete limit for ["+guild_id+"] updated from ["+old_limit+"] to ["+new_limit+"]");
	},
);

// nr.globalCommand(
// 	"/help/owner/querydb",
// 	"querydb",
// 	{
// 		usage: "querydb",
// 		description: "",
// 		examples: [],
// 	},
// 	nr.passthroughArgs,
// 	async ([cmd], info) => {
// 		if (!Info.theirPerm.owner(info)) return;
// 		// select COUNT(id) from guilds;
// 		// select COUNT(id) from guilds where welcome is not null;
// 		// select * from guilds where id = '431534524324132';
// 	},
// );


nr.globalCommand(
	"/help/owner/createthread",
	"createthread",
	{
		usage: "createthread",
		description: "create a thread",
		examples: [],
		perms: {raw_message: true},
	},
	nr.list(),
	async ([], info) => {
		if(!(info.channel instanceof TextChannel)) return;
		const thread = await info.channel.threads.create({
			name: "demo-thread",
			autoArchiveDuration: 10080,
		});
		await thread.send(info.member!.toString());
		return await info.success("I created the thread: <#"+thread.id+">!");
	}
);
// nr.globalCommand(
// 	"/help/owner/threadoptin",
// 	"threadoptin",
// 	{
// 		usage: "threadoptin",
// 		description: "threadoptin",
// 		examples: [],
// 		perms: {raw_message: true},
// 	},
// 	nr.list(),
// 	async ([], info) => {
// 		await (info.message.client as any).api.guilds(info.guild.id!).threads["bot-opt-in"].post();
// 		return await info.success("I've opted in the guild!");
// 	}
// );
// ~~was checking if I could get around the member limit requirement~~

nr.globalCommand(
	"/help/owner/eval",
	"eval",
	{
		usage: "eval {Required|javascript.code}",
		description: "evaluate javascript",
		examples: [
			{
				in: "eval {Code|client.guilds.cache.size}",
				out: "{Atmention|you}, 1824",
			},
		],
		perms: {raw_message: true},
	},
	nr.passthroughArgs,
	async ([cmd], info) => {
		cmd = cmd.replace(/(^`|`$)/g, "").trim();
		if (cmd === "1 + 1") return await info.result("2");
		if (cmd === "client.guilds.cache.size")
			return await info.result(
				"" +
					info.message.client.guilds.cache.size.toLocaleString(
					    "en-US",
					),
			);
		if (cmd === "client.token") return await info.error("no");
		if (cmd.startsWith('message.reply("') && cmd.endsWith('")')) {
			const origmsg = await info.result(
				'<a:loading:682804438783492139> Promise { <state>: "pending" }',
			);
			const armsg = await info.raw_message!.reply({
				content: stripMentions(cmd.substring(15, cmd.length - 2)),
				...Info.msgopts,
			});
			if (origmsg && origmsg[0])
				await origmsg[0].edit(
					"Message { author: " +
						info.atme +
						', content: "' +
						safe(armsg.content.substr(0, 50)) +
						'", createdAt: ' +
						armsg.createdAt.toString() +
						", ..." +
						(Object.keys(origmsg[0]).length - 3) +
						" more }",
				);
			return;
		}
		await info.error(
			"```diff\n- SyntaxError: expected expression, got ')'\n```",
		);
	},
);

// let stateful_handlers = {
// 	start(...a: any[]) {},
// 	register(...a: any[]) {},
// };
// stateful_handlers.register(
// 	"permessage",
// 	// ok the idea:
// 	// a flow like this
// 	//    React [reaction] to join
// 	// and a 60s countdown
// 	// huh the 60s countdown part makes this uuh
// 	// not as doable
// 	// because timedevents is completely broken on production
// 	() => {

// 	},
// );

// nr.globalCommand(
// 	"/help/owner/permessage",
// 	"permessage",
// 	{
// 		usage: "permessage",
// 		description: "permessage test",
// 		examples: [],
// 		perms: {},
// 	},
// 	nr.passthroughArgs,
// 	async ([cmd], info) => {
// 		stateful_handlers.start(info, "permessage");
// 	}
// );

// const timing_handlers = {
// 	register(..._: any[]) {},
// 	start(..._: any[]) {},
// };

// timing_handlers.register("pmUser", () => {

// });

// nr.globalCommand(
// 	"/help/owner/remindme2",
// 	"remindme2",
// 	{
// 		usage: "remindme2",
// 		description: "remindme2",
// 		examples: [],
// 		perms: {},
// 	},
// 	nr.passthroughArgs,
// 	async ([cmd], info) => {
// 		timing_handlers.start("pmUser");
// 	},
// );