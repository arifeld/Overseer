const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

const fs = require("fs")
const path = require("path")

const base = require(path.join(__dirname, "../../custom_modules/base.js"))
const convertTime = require("parse-duration")
const humanizeDuration = require("humanize-duration")

var casesSaved = 0

module.exports = class MergeFiles extends Command {
	constructor(client) {
		super(client, {
			name: "mergefiles",
			group: "mod_utility",
			memberName: "mergefiles",
			description: "Oh god oh fuck.",
            guildOnly: true,
            ownerOnly: true
		})
	}


	async run(msg){

        let serverInfo = base.getServerInfo(msg)
        var fileLocationNew = path.join(__dirname, "../../", "recovery.JSON")
        var server = JSON.parse(fs.readFileSync(fileLocationNew, "utf8")); // read the file.

        let newFileInfo = server.guild

        // we want to iterate over both elements - "bans" and "notes" and add them to serverInfo.

        let newBanInfo = newFileInfo.bans
        let newNoteInfo = newFileInfo.notes

        let currentBanInfo = serverInfo.modLog
        let currentNoteInfo = serverInfo.modNotes

        // iterate through all modlogs
        for (let user in newBanInfo){
            console.log(user)
            let logs = newBanInfo[user]
            if (user in currentBanInfo){
                // iterate through all log values and push
                for (let i=0; i<logs.length; i++){
                    currentBanInfo[user].push(logs[i])
                }
            }
            else{
                currentBanInfo[user] = logs
            }
        }

        for (let noteUser in newNoteInfo){
            let notes = newNoteInfo[noteUser]
            if (noteUser in currentNoteInfo){
                for (let j=0; j<notes.length;j++){
                    currentNoteInfo[noteUser].push(notes[j])
                }
            }
            else{
                currentNoteInfo[noteUser] = notes
            }
        }
        console.log("Done!")
        return base.saveServerInfo(msg, serverInfo)


    }
}
