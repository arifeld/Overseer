const { Command } = require("discord.js-commando");
const { Attachment, RichEmbed } = require('discord.js'); // required for message embedding.
const path = require("path")
const base = require(path.join(__dirname, "../../custom_modules/base.js"))


module.exports = class Rule extends Command {
	constructor(client) {
		super(client, {
			name: "rule",
			group: "mod_utility",
			memberName: "rule",
			description: "Displays the given rule as an image",
			guildOnly: true,
      args: [

        {
          key: "ruleNum",
          prompt: "what rule do you want to display?",
          type: "integer",
          default: "INVALID_ARGUMENT",
          validate: arg => {
            return true
          }
        }
      ]

		})
	}


	run(msg, args){

    const {ruleNum} = args;
    const minRule = 1;
    const maxRule = 11;



    if (!msg.member.hasPermission("MANAGE_MESSAGES")){
      const errorEmbed = new RichEmbed()
        .setTitle("**You do not have permission to use this command!**")
        .setDescription("This command requires the 'Manage Messages' permission.")
        .setAuthor(msg.member.displayName, msg.author.avatarURL)
        .setColor(0x0089ff)
      return msg.embed(errorEmbed)
    }


    // Check to make sure they entered a valid number.
    if (typeof(ruleNum) !== "number" || ruleNum < minRule || ruleNum > maxRule){
      return msg.embed(base.argError(msg, "<rule # between 1 and 11>"))
    }

		let sendEmbed = true

		const ruleEmbed = new RichEmbed()
			.setColor(0x0000FF)

		switch(ruleNum){
			case 1:
				ruleEmbed.setTitle("**1) No Hate Speech or Discrimination.**")
				ruleEmbed.setDescription("a) Homophobia, transphobia, racism, or any other forms of discrimination against a group of people based on race, gender identity, sexuality, political views, age, religion, national origin, and disabilities is strictly prohibited.\n\nb) This includes any use of slurs or attempts to circumvent our filter for slurs.")
			 	//ruleEmbed.addField("**1) Respect Everyone**", "Treat everyone with the same amount of respect, even if you do not agree with them or like them. This includes but is not limited to making jokes at the expense of others, disregarding peoples feelings, witch hunting, swearing at others, or personal attacks.")
				break
			case 2:
				ruleEmbed.setTitle("**2) No Personal Attacks.**")
				ruleEmbed.setDescription("a) Harassing or personally attacking users is not allowed. Ad-hominem attacks, threats, and targeting of users, whether direct or indirect, all fall under this rule.\n\nb) Sexual harassment is strictly prohibited. ")
				//ruleEmbed.addField("**2) No hate speech or discrimination**", "This includes any derogatory terms or offensive terms and slurs. As well as any targeted words at someones race, gender identity, sexuality, political views, age, religion, national origin, and disabilities.")
				break
			case 3:
				ruleEmbed.setTitle("**3) No Spamming.**")
				ruleEmbed.setDescription("Any spamming, including text, image, and voice spam, is prohibited. Please check a channel’s description to learn more about its specific rules regarding these policies.")
				//ruleEmbed.addField("**3) No spam**", "Lyric spam, character spam (including caps lock), image spam, message spam, `@mention` spam, or spam in VC is not allowed. Shitposting is also not allowed.")
				break
			case 4:
				ruleEmbed.setTitle("**4) No Misuse.**")
				ruleEmbed.setDescription("a) Misuse of a channel or the server will be met with punishment.\n\nb) The following are considered misuse:\n\ni) Speaking in non-English languages;\nii) Using the incorrect channel for a given topic;\niii) Non-serious discussion in channels under the 'Serious' category; and\niv) Failing to comply with moderator instructions. There may be situations not covered by the rules, or times where a rule may not perfectly fit a situation. In these cases, please respect moderator decisions in the matter.")
				//ruleEmbed.addField("**4) No NSFW content**", "This is a family friendly server meaning no NSFW content is allowed unless in areas that specify otherwise. This means no mention or showing of gore, violence, or overly promiscuous content.")
				break
			case 5:
				ruleEmbed.setTitle("**5) No Personal Information.**")
				ruleEmbed.setDescription("a) Out of concerns of doxxing, please do not share any identifying information on the r/teamagers server.\n\nb) This includes last names, last initials, email addresses, town-specific locations, school names, etc.\n\nc) Sharing the personal information of another user will be considered doxxing and will be met with a permanent ban.\n\nd) This rule also applies to yourself! Self-doxxing is not allowed.")
				//ruleEmbed.addField("**5) No harassment**", "Harassment is not allowed whether intentional or unintentional; which includes encouraging harassment or participating in any form of harassment.")
				break
			case 6:
				ruleEmbed.setTitle("**6) No NSFW Content.**")
				ruleEmbed.setDescription("a) NSFW content is strictly prohibited. This includes images containing pornography, gore, NSFL content, and overly NSFW text.")
				//ruleEmbed.addField("**6) Use the appropriate channels**", "Failing to use the appropriate channels, especially after a mod has instructed, will result in a warn.")
				break
			case 7:
				ruleEmbed.setTitle("**7) No Ping Abuse.**")
				ruleEmbed.setDescription("a) Please only ping the moderators in case of an emergency. Before pinging the staff team, ping online members of the staff team first.\n\nb) Please do not spam ping users, as this will also lead to punishment.")
				//ruleEmbed.addField("**7) Do not exploit gray areas or loopholes in the rules**", "Not all situations can be covered by the rules. You must follow a mod’s instructions, even if it is not stated in the rules")
				break
			case 8:
				ruleEmbed.setTitle("**8) No Advertising.**")
				ruleEmbed.setDescription("a) Advertising for other communities (e.g. subreddits, discords) is strictly prohibited.\n\nb) Self-promotion is permitted in #self as long as it is compliant with our rules regarding personal information (i.e. links to Twitch streams, Soundcloud, Youtube accounts are allowed, but links to your personal Instagram account are not).")
				//ruleEmbed.addField("**8) Respect moderators decisions**", "You may appeal a ban, but you must not harass or antagonize a moderator. This will result in either further punishment or loss of the appeal.")
				break
			case 9:
				ruleEmbed.setTitle("**9) No Inappropriate Profiles.**")
				ruleEmbed.setDescription("a) Inappropriate profile pictures, usernames, or discord tags that are in violation with any of our rules must be changed upon moderator request.\n\nb) Failure to change any offending parts of your profile will lead to you being removed from the server until a satisfactory change has occurred.")
				//ruleEmbed.addField("**9) No advertising**", "No advertising is allowed regarding any content.")
				break
			case 10:
				ruleEmbed.setTitle("**10) No Ban and Mute Evasion.**")
				ruleEmbed.setDescription("a) Using an alternative account to evade any punishments (mutes, bans) is strictly prohibited and will result in a permanent ban on all accounts involved.\n\nb) Alts are allowed in specific circumstances with moderator approval. If you require an alt on the server, please contact one of the moderators with the name of your alt and the reason for requiring it before joining.")
				//ruleEmbed.addField("**10) No raiders, trolls, etc.**", "We will permanently ban raiders, trouble makers, and/or trolls immediately, no exceptions.")
				break
			case 11:
				ruleEmbed.setTitle("**11) No Raiding.**")
				ruleEmbed.setDescription("a) Organizing raids within or raiding the r/teamagers server will result in all involved users being permanently banned.")
				//ruleEmbed.addField("**11) No releasing of personal information about yourself or anyone else**", "This includes home address, email, last name, banking details, etc. This excludes your first name and city/state/province/county or age. Keep personal information you have learned of others to yourself, releasing it without their permission can result in a punishment. This is to prevent doxxing and maintain safety.")
				break
			/*case 12:
				//ruleEmbed.addField("**12) Do not use the server for medical help or attention**", "This includes serious physical and/or mental conditions or injuries. Instead, seek professional help as no one in the server is trained. If you are making people uncomfortable or triggering others, you may either be warned or removed from the server")
				break
			case 13:
				ruleEmbed.addField("**13) Refrain from excessive talk about alcohol or drugs**", "Discussing drugs or alcohol in #serious is permitted as long as you are not encouraging others to try it.")
				break
			case 14:
				ruleEmbed.addField("**14) Foreign language is not allowed**", "This includes in username. We are an English only server.")
				break
			case 15:
				ruleEmbed.addField("**15) No inappropriate profile pictures, nickname or statuses**", "The moderators hold a right to ask you to change your name if it is inappropriate, unreadable, or blank; this also applies to profile pictures and statutes. You must do so or else this may result in further punishment.")
				break
			case 16:
				ruleEmbed.addField("**16) Do not spam mention the moderators**", "You may only mention us when there is a serious or concerning situation occurring if none of us are there to handle it.")
				break
			case 17:
				ruleEmbed.addField("**17) Alt accounts are only allowed in certain circumstances.**", "If you have an issue with discord that requires you to have two or more accounts in the server, you must let us know.\n\nUsing alt accounts to circumvent punishment can result in a permanent ban.\n\nPlease contact a mod if you need more than one account in the server. If you do not, and we find that you are alting - you will be permanently banned.")
				break*/
			default:
				msg.embed(base.argError(msg, this.client.options.commandPrefix + "rule <rule # between 1 and 17>"))
				sendEmbed = false
				break


		}

    // Now we want to figure out what rule to display.
    //const attachment = new Attachment(path.join(__dirname, "../../rules/rule" + ruleNum.toString() + ".png"), "rule.png")

    // Now add it to the embed.
    //const imageEmbed = new RichEmbed()
      //.attachFile(attachment)
      //.setImage('attachment://rule.png')
			if (sendEmbed){
				return msg.embed(ruleEmbed)
			}
			else{
				return
			}
  }
}
