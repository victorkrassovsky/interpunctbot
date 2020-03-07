import * as nr from "../NewRouter";
import { dgToDiscord } from "../parseDiscordDG";

nr.addDocsWebPage(
	"/help",
	"Help",
	"interpunct bot commands",
	`{Title|inter·punct bot}

{LinkSummary|/help/configuration}
{LinkSummary|/help/fun}
{LinkSummary|/help/emoji}
{LinkSummary|/help/channels}
{LinkSummary|/help/administration}
{LinkSummary|/help/customcommands}
{LinkSummary|/help/log}
{LinkSummary|/help/speedrun}
{LinkSummary|/help/quickrank}`,
);

nr.addDocsWebPage(
	"/index",
	"Home",
	"Website homepage",
	"{Heading|Inter·punct Bot}\n\nThis website is for version 3 of {Interpunct} which is currently in development. For version 2, see https://top.gg/bot/433078185555656705\n\n{Screenshot|https://top.gg/api/widget/433078185555656705.png}",
);

nr.addDocsWebPage(
	"/updates",
	"Updates",
	"bot updates",
	"{Heading|Bot Updates}\n\n{LinkSummary|/updates/ipv3}",
);

nr.addDocsWebPage(
	"/updates/ipv3",
	"ipv3 update",
	"ipv3 update",
	`{Title|2020-03-07, Interpunct version 3}

Adds many new things and improves the experience of some old things. There are still lots of messages that haven't been written yet or are slightly confusing, if you have any issues, ask on the {Link|https://interpunct.info/support|Support Server}.

{Heading|New Commands}
{LinkSummary|/help/quickrank}
{LinkSummary|/help/channels/autodelete}
{CmdSummary|connect4}
{CmdSummary|remindme}
{CmdSummary|trivia}
{CmdSummary|minesweeper}
{CmdSummary|vote}
{CmdSummary|members}
{CmdSummary|slowmode set}
{CmdSummary|wr}
{CmdSummary|stats}

{Heading|Other Things}
The purge command is now significantly faster
This website is completely new.
Also there are lots of other minor changes.`,
);

nr.addDocsWebPage(
	"/404",
	"404",
	"Not found",
	"{Heading|Uh oh!}\n\n404 not found.",
);

nr.addDocsWebPage(
	"/help/administration",
	"Administration",
	"commands to help administration",
	`{Title|Administration}

{Interpunct} has a few commands for helping with administration

{CmdSummary|purge}
{CmdSummary|autoban add}
{CmdSummary|autoban list}
{CmdSummary|autoban clear}`,
);

nr.addErrorDocsPage("/errors/help-path-not-found", {
	overview:
		"That help page could not be found. For all help, use {Command|help}",
	detail: "",
	mainPath: "/help/help/help",
});

nr.addErrorDocsPage("/errors/arg/duration/no-duration", {
	overview: "This command requires a duration like 10s or 25 minutes.",
	detail: "",
	mainPath: "/args/duration",
});

/*
errors should look like this:

I don't understand the unit you provided.
Usage: `ip!remindme <when> [message]`
> Error Help: https://interpunct.info/errors/arg/duration/bad-unit
> Duration Help: https://interpunct.info/arg/duration
> Command Help: https://interpunct.info/help/fun/remindme

maybe even put it in an embed

first implement the error pairing thing so when the original message is deleted, the error goes away too

Error!
] body
] clean [links like this](https://)
footer: For more help, join the support server. https://interpunct.info/support

*/
nr.addErrorDocsPage("/errors/arg/duration/bad-unit", {
	overview: "I don't understand the unit you provided.",
	detail: "",
	mainPath: "/args/duration",
});

nr.globalCommand(
	"/help/help/help", // hmm
	"help",
	{
		usage: "help {Optional|command}",
		description: "Bot help",
		examples: [],
	},
	nr.list(...nr.a.words()),
	async ([cmd], info) => {
		const autoResolution = "/help/" + (cmd || "").split(" ").join("/");

		const docsPage =
			nr.globalDocs[cmd || "/help"] ||
			nr.globalDocs[autoResolution] ||
			nr.globalDocs[
				nr.globalCommandNS[cmd.toLowerCase()]?.docsPath || ""
			];
		if (docsPage) {
			const bodyText = dgToDiscord(docsPage.body, info);
			await info.result(
				// dgToDiscord(`{Var|bodyText}\n\n{Bold|Full Help}: {Link|${url}}`) // concept
				(
					bodyText +
					"\n\n" +
					"**Full Help**: <https://interpunct.info" +
					docsPage.path +
					">"
				).replace(/\n\n+/g, "\n\n"),
			);
		} else {
			await info.docs("/errors/help-path-not-found", "error");
		}
	},
);
