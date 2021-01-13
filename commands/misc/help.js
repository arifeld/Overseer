const { stripIndents, oneLine } = require('common-tags');
const { Command } = require("discord.js-commando");
//const { disambiguation } = require('../../util');
const { ReactionCollector, RichEmbed } = require("discord.js")

module.exports = class NewHelpCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'help2',
			group: 'misc',
			memberName: 'help2',
			aliases: ['commands2'],
      ownerOnly: true,
			description: 'Displays a list of available commands, or detailed information for a specified command.',
			details: oneLine`
				The command may be part of a command name or a whole command name.
				If it isn't specified, all available commands will be listed.
			`,
			examples: ['help', 'help prefix'],
			guarded: true,
			args: [
				{
					key: 'command',
					prompt: 'Which command would you like to view the help for?',
					type: 'string',
					default: ''
				}
			]
		});
	}

	async run(msg, args) { // eslint-disable-line complexity
		const groups = this.client.registry.groups;
		const commands = this.client.registry.findCommands(args.command, false, msg);
		const showAll = args.command && args.command.toLowerCase() === 'all';


    const helpEmbed = new RichEmbed()
      .setColor(0xadd8e6)
      .setTitle("Overseer Help Command")

    // Now we need to go through each command block.
    const groupNames = Array.from(groups.keys())
    const groupValues = Array.from(groups.values())

    // Assumingly this maps the names to values in order.
    let pageIndex = 0

    // We are going to generate every single page of the command straight away, then iterate our way over it (as opposed to dynamically creating each page)
    let commandPages = []


    // Generate the command info we want.
    for (let i=0; i<groupNames.length; i++){
      let messageContent = await this.generateCommands(msg, groupNames[i], groupValues[i])
      if (messageContent !== false){
        commandPages.push([messageContent])
      }
    }

    helpEmbed.setFooter("Run /help [command] to view more information on a command.\nPage " + (pageIndex+1).toString() + " of " + commandPages.length)

    for (let commandIndex=0; commandIndex<commandPages[pageIndex].length; commandIndex++){
      let currentCommand = commandPages[pageIndex][commandIndex]
      helpEmbed.addField("**" + currentCommand[0] + "**", currentCommand[1])
    }

    const trackingEmojis = ["⏮️", "⏪", "⏩", "⏭️"]
    const reactionFilter = (reaction, user) => {
      return trackingEmojis.includes(reaction._emoji.name)
    }

    msg.embed(helpEmbed)
      .then (async function(embed){
        await embed.react("⏮️")
          .then (async function(_){
            await embed.react("⏪")
              .then(async function(__){
                await embed.react("⏩")
                .then(async function(___){
                  await embed.react("⏭️")
                  .then(async function(____){
                    // now we need to create reaction collectors.

                    let emojiCollector = new ReactionCollector(embed, reactionFilter)
                    // Create a timeout.
                    let endTimer = setTimeout(() => {
                      emojiCollector.stop()
                    }, 1000 * 60)


                    emojiCollector.on("collect", (reaction, collector) => {
                      for (const prop in reaction){
                        console.log(prop)
                      }

                      if (reaction.users.has(msg.member.id)){
                        if (reaction._emoji.name == "⏮️"){
                          pageIndex = 0
                        }
                        else if (reaction.emoji.name == "⏪"){
                          if (pageIndex != 0){
                            pageIndex = pageIndex-1
                          }
                        }
                        else if (reaction.emoji.name == "⏩"){
                          if ((pageIndex+1) !== commandPages.length){
                            pageIndex = pageIndex+1
                          }
                        }
                        else if (reaction.emoji.name == "⏭️"){
                          pageIndex = commandPages.length - 1
                        }
                        else{
                          // well, we shouldn't be here.
                          console.log("Seems like we've picked up on an emoji that we are both tracking and not tracking. Bit odd?")
                        }
                        refreshEmbed()
                        clearTimeout(endTimer)
                        let endTimer = setTimeout(() => {
                          emojiCollector.stop()
                        }, 1000 * 60)
                      }

                      embed.reactions.remove(msg.member.id)

                    })
                  })
                })
              })
          })
      })

    }

/*
		if(args.command && !showAll) {
			if(commands.length === 1) {
				let help = stripIndents`
					${oneLine`
						__Command **${commands[0].name}**:__ ${commands[0].description}
						${commands[0].guildOnly ? ' (Usable only in servers)' : ''}
						${commands[0].nsfw ? ' (NSFW)' : ''}
					`}

					**Format:** ${msg.anyUsage(`${commands[0].name}${commands[0].format ? ` ${commands[0].format}` : ''}`)}
				`;
				if(commands[0].aliases.length > 0) help += `\n**Aliases:** ${commands[0].aliases.join(', ')}`;
				help += `\n${oneLine`
					**Group:** ${commands[0].group.name}
					(\`${commands[0].groupID}:${commands[0].memberName}\`)
				`}`;
				if(commands[0].details) help += `\n**Details:** ${commands[0].details}`;
				if(commands[0].examples) help += `\n**Examples:**\n${commands[0].examples.join('\n')}`;

				const messages = [];
				try {
					messages.push(await msg.direct(help));
					if(msg.channel.type !== 'dm') messages.push(await msg.reply('Sent you a DM with information.'));
				} catch(err) {
					messages.push(await msg.reply('Unable to send you the help DM. You probably have DMs disabled.'));
				}
				return messages;
			} else if(commands.length > 15) {
				return msg.reply('Multiple commands found. Please be more specific.');
			} else if(commands.length > 1) {
				return msg.reply(disambiguation(commands, 'commands'));
			} else {
				return msg.reply(
					`Unable to identify command. Use ${msg.usage(
						null, msg.channel.type === 'dm' ? null : undefined, msg.channel.type === 'dm' ? null : undefined
					)} to view the list of all commands.`
				);
			}
		} else {
			const messages = [];
			try {
				messages.push(await msg.direct(stripIndents`
					${oneLine`
						To run a command in ${msg.guild ? msg.guild.name : 'any server'},
						use ${Command.usage('command', msg.guild ? msg.guild.commandPrefix : null, this.client.user)}.
						For example, ${Command.usage('prefix', msg.guild ? msg.guild.commandPrefix : null, this.client.user)}.
					`}
					To run a command in this DM, simply use ${Command.usage('command', null, null)} with no prefix.

					Use ${this.usage('<command>', null, null)} to view detailed information about a specific command.
					Use ${this.usage('all', null, null)} to view a list of *all* commands, not just available ones.

					__**${showAll ? 'All commands' : `Available commands in ${msg.guild || 'this DM'}`}**__

					${(showAll ? groups : groups.filter(grp => grp.commands.some(cmd => cmd.isUsable(msg))))
						.map(grp => stripIndents`
							__${grp.name}__
							${(showAll ? grp.commands : grp.commands.filter(cmd => cmd.isUsable(msg)))
								.map(cmd => `**${cmd.name}:** ${cmd.description}${cmd.nsfw ? ' (NSFW)' : ''}`).join('\n')
							}
						`).join('\n\n')
					}
				`, { split: true }));
				if(msg.channel.type !== 'dm') messages.push(await msg.reply('Sent you a DM with information.'));
			} catch(err) {
				messages.push(await msg.reply('Unable to send you the help DM. You probably have DMs disabled.'));
			}
			return messages;
		}
	}*/

  async generateCommands(msg, categoryName, commandGroup){
    let commands = commandGroup.commands
    let embedContent = []
    let isViewable = false
    commands.forEach( (command, name) => {
      if (command.topPerm !== undefined){
        if (!msg.member.hasPermission(command.topPerm)){ return }
        else{
          isViewable = true
        }
      }
      else{
        isViewable = true
      }

      embedContent.push(["**" + this.client.commandPrefix + name + " " + command.format + "**"], command.description)
    })

    if (isViewable){
      return embedContent
    }
    else{
      return false
    }
  }

  async refreshEmbed(msg, embed, commandPages, pageIndex){
    const newEmbed = new RichEmbed()
      .setColor(embed.embed[0].color)
      .setTitle(embed.embed[0].title)

      for (let commandIndex=0; commandIndex<commandPages[pageIndex].length; commandIndex++){
        let currentCommand = commandPages[pageIndex][commandIndex]
        newEmbed.addField("**" + currentCommand[0] + "**", currentCommand[1])
      }

      embed.edit({embed: newEmbed})

  }
};
