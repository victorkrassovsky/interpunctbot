import Info from "./src/Info";
import * as Discord from "discord.js";

export const messages = {
	emoji: {
		failure: "<:failure_2:547081084710682643>"
	},
	general: {
		command_cannot_be_used_in_pms: (info: Info) =>
			`This command cannot be used in PMs!`
	},
	settings: {
		autospace_enabled: (info: Info) =>
			`When you make a new channel or edit an existing channel, all dashes will be replaced with spaces. To disable this, use
\`\`\`
${info.prefix}space channels disable
\`\`\``,
		autospace_disabled: (info: Info) =>
			`Channels will no longer have spaces added to their names.`
	},
	channels: {
		spacing: {
			no_channels_to_space: (info: Info) =>
				`**There are no channels to put spaces in!**
To add spaces to a channel, put dashes (\`-\`) where you want the spaces to go or replace a custom character using
\`\`\`
${info.prefix}space channels \`_\`
\`\`\`
> More Info: https://interpunct.info/spacing-channels`,
			succeeded_spacing: (info: Info, channels: Discord.Channel[]) =>
				`The channels ${channels
					.map(c => c.toString())
					.join(", ")} now have spaces.
If you want channels to automatically have spaces in the future, use
\`\`\`
${info.prefix}space channels automatically
\`\`\``,
			partially_succeeded_spacing: (
				info: Info,
				channels: Discord.Channel[],
				failedChannels: Discord.Channel[]
			) =>
				`The channels ${channels
					.map(c => c.toString())
					.join(", ")} now have spaces.
The channels ${failedChannels
					.map(c => c.toString())
					.join(
						", "
					)} could not be given spaces. Maybe ${info.message.client.toString()} does not have permission to Manage Channels?
If you wanted spaces in these channels, check the channel settings to see if ${info.message.client.toString()} has permission to manage them.

> Discord Support: https://support.discordapp.com/hc/en-us/articles/206029707-How-do-I-set-up-Permissions-
> Command Help: https://interpunct.info/spacing-channels`,
			failed_spacing: (info: Info, failedChannels: Discord.Channel[]) =>
				`The channels ${failedChannels
					.map(c => c.toString())
					.join(
						", "
					)} could not be given spaces. Maybe ${info.message.client.toString()} does not have permission to Manage Channels?
If you wanted spaces in these channels, check the channel settings to see if ${info.message.client.toString()} has permission to manage them.

> Discord Support: https://support.discordapp.com/hc/en-us/articles/206029707-How-do-I-set-up-Permissions-
> Command Help: https://interpunct.info/spacing-channels`
		}
	}
};
