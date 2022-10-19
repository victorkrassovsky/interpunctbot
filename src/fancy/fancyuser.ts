import { App, SlashCommandElement, SlashCommandGroup, u } from "./fancylib";

// todo: this shouldn't register global state, instead it should go in app
require("./user/persistent/rock_paper_scissors") as typeof import("./user/persistent/rock_paper_scissors");

export function app(): App {
	return {
		message_context_menu: [],
		slash_commands: [
			SlashCommandGroup({label: u("play"), description: u("Play a game"), children: [
				(require("./user/commands/play/rock_paper_scissors") as typeof import("./user/commands/play/rock_paper_scissors")).default(),
			]}),
			SlashCommandGroup({label: u("dev"), default_permission: false, description: u("Developer Commands"), children: [
				(require("./user/commands/dev/reload_libfancy") as typeof import("./user/commands/dev/reload_libfancy")).default(),
				(require("./user/commands/dev/restart") as typeof import("./user/commands/dev/restart")).default(),
			]}),
			(require("./user/commands/spoiler") as typeof import("./user/commands/spoiler")).default(),
			(require("./user/commands/remindme") as typeof import("./user/commands/remindme")).default(),
			// (require("./user/commands/run") as typeof import("./user/commands/run")).default(),
		],
		guildSlashCommands: async (guild_id: string): Promise<SlashCommandElement[]> => [

		],
	};
}
