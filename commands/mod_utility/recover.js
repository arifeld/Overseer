const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.

const fs = require("fs")
const path = require("path")

const base = require(path.join(__dirname, "../../custom_modules/base.js"))
const convertTime = require("parse-duration")
const humanizeDuration = require("humanize-duration")

var casesSaved = 0
var fileLocation = path.join(__dirname, "../../", "recovery.JSON")

module.exports = class Recover extends Command {
	constructor(client) {
		super(client, {
			name: "recover",
			group: "mod_utility",
			memberName: "recover",
			description: "Oh god oh fuck.",
            guildOnly: true,
            ownerOnly: true
		})
	}


	async run(msg){

        if (!fs.existsSync(fileLocation)){
            fs.writeFileSync( fileLocation, '{"guild": {}}', {encoding: "utf8", flag: "wx" } ) // create the file if it doesn't already exist and write some JSON to it to stop errors.
        }
        var server = JSON.parse(fs.readFileSync(fileLocation, "utf8")); // read the file.


        let logChannel = "667920749591265290"
        let reference = "745481441378566204"
        let foundMessages = []

        let generatedTable = {
            "bans": {},
            "notes": {}
        }

        var recurseSaveCall = this.recurseSave.bind(this)

        generatedTable = await recurseSaveCall(msg, reference, generatedTable)

        console.log(generatedTable)
        /*fs.writeFile(fileLocation, JSON.stringify({"guild": generatedTable}, null, 2), (err) => {
            if (err){
                console.error(error)
                return msg.reply("an unexpected error occured whilst trying to save. This **will** result in data loss.\nTry repeating the command. If that fails, please contact @Feldma#1776.\nPlease give him the following code: " + msg.guild.id)
            }
        })*/


        /*await msg.guild.channels.get(logChannel).fetchMessages({after: reference, limit:100})
            .then(msgCollection => {
                let newReference = msgCollection.firstKey()
                console.log(msgCollection.firstKey())
                console.log(msgCollection.lastKey())

                msgCollection = new Map(Array.from(msgCollection).reverse())
                for (let [key, value] of msgCollection){
                    if (value.embeds[0] !== undefined && value.embeds[0].fields[0] !== undefined && value.embeds[0].fields[0].name == "**New Mod Action:**"){
                        foundMessages.push(key)
                        generatedTable = this.handleMessage(msg, value, generatedTable)
                    }
                }

                console.log(foundMessages)

                msg.guild.channels.get(logChannel).fetchMessages({after: newReference, limit:100})
                    .then(msgCollection1 => {
                        console.log(msgCollection1.firstKey())
                        console.log(msgCollection1.lastKey())
                        msgCollection1 = new Map(Array.from(msgCollection1).reverse())
                        for (let [key1, value1] of msgCollection1){
                            if (value1.embeds[0] !== undefined && value1.embeds[0].fields[0] !== undefined && value1.embeds[0].fields[0].name == "**New Mod Action:**"){
                                console.log("running")
                                foundMessages.push(key1)
                                generatedTable = this.handleMessage(msg, value1, generatedTable)
                            }
                        }

                        console.log(foundMessages)
                        fs.writeFile(fileLocation, JSON.stringify({"guild": generatedTable}, null, 2), (err) => {
                            if (err){
                                console.error(error)
                                return msg.reply("an unexpected error occured whilst trying to save. This **will** result in data loss.\nTry repeating the command. If that fails, please contact @Feldma#1776.\nPlease give him the following code: " + msg.guild.id)
                            }
                        })
                    })


            })*/





    }

    async recurseSave(msg, reference, generatedTable){
        var self = this
        let logChannel = "667920749591265290"
        let continueRecurse = true

        // grab the next 100 messages
        await msg.guild.channels.get(logChannel).fetchMessages({after:reference, limit:100})
            .then(async function(msgCollection){

                // base case: less than 100 messages found
                if (msgCollection.size < 100){
                    console.log("BASE CASE REACHED")
                    continueRecurse = false
                }
                else{
                    console.log("CASES SAVED: " + casesSaved)
                }


                let nextReference = msgCollection.firstKey()

                msgCollection = new Map(Array.from(msgCollection).reverse())
                for (let [key, value] of msgCollection){
                    if (value.embeds[0] !== undefined && value.embeds[0].fields[0] !== undefined && value.embeds[0].fields[0].name == "**New Mod Action:**"){
                        generatedTable = self.handleMessage(msg, value, generatedTable)
                    }
                }

                if (continueRecurse){
                    await sleep(1000)
                    return self.recurseSave(msg, nextReference, generatedTable)
                }
                else{
                    fs.writeFile(fileLocation, JSON.stringify({"guild": generatedTable}, null, 2), (err) => {
                        if (err){
                            console.error(error)
                            return msg.reply("an unexpected error occured whilst trying to save. This **will** result in data loss.\nTry repeating the command. If that fails, please contact @Feldma#1776.\nPlease give him the following code: " + msg.guild.id)
                        }
                    })
                    return generatedTable
                }
            })
    }

    handleMessage(msg, message, table){
        // Inputs: message, a message we know has an embed we want to access.
        // Outputs: updated table

        // JSON format:
        /*
        {
          "case": 490,
          "action": "unban",
          "reason": "None given",
          "mod": "139279634796773376",
          "timestamp": 1584692256282
        },


                // phrase to handle:

                /*
                    - banned
                    - updated the ban - nvm, can't easily handle + not worth for 30 cases
                    - unbanned
                    - muted
                    - updated the mute - nvm, same as above, only 27 cases
                    - added a mod-note
                    - edited mod-note - nvm, only happened 3 times ever
                    - warned
                    - removed a warn
                    - unmuted


                */

        casesSaved++

        let fieldValue = message.embeds[0].fields[0].value
        let firstSpaceIndex = fieldValue.indexOf(" ")
        let moderator = fieldValue.substr(0, firstSpaceIndex).replace(/\D/g, '') // the moderator that took the action
        let updatedString = fieldValue.substr(firstSpaceIndex).trim()
        let secondSpaceIndex = updatedString.indexOf("<@")

        // Possible that this index doesn't exist because the user reference is broken. In this case, just ignore.
        if (secondSpaceIndex == -1){
            return table // no change
        }

        let actionString = updatedString.substr(0, secondSpaceIndex) // the action that has been taken
        let thirdString = updatedString.substr(secondSpaceIndex).trim()
        let thirdSpaceIndex = thirdString.indexOf(">")
        let user = thirdString.substr(0, thirdSpaceIndex+1).replace(/\D/g, '') // the user that it is being applied to
        let remainString = thirdString.substr(thirdSpaceIndex+1).trim()
        // Now, grab the case number
        let caseNumber = undefined
        if (message.embeds[0].footer !== null){
            caseNumber = Number(message.embeds[0].footer.text.replace(/\D/g, ''))
        }

        // Grab the timestamp of the message
        let timestamp = message.createdTimestamp

        //console.log("CASE NUMBER: " + caseNumber)
        //console.log(actionString)


        // Begin formatting based on action.
        if (actionString.includes("unbanned")){ // need to do unbanned and unmuted before banned and muted.
            // Pretty simple, we just don't use a reason.
            let dataObj = {
                "case": caseNumber,
                "action": "unban",
                "reason": "None given",
                "mod": moderator,
                "timestamp": timestamp
            }

            if (user in table["bans"]){
                table["bans"][user].push(dataObj)
            }
            else{
                table["bans"][user] = [dataObj]
            }
            //console.log(user)

            return table
        }
        else if (actionString.includes("banned")){
            // determine length
            let durationIndex = remainString.indexOf("with the reason")
            let durationString = remainString.substr(0, durationIndex).trim()
            let length = 0
            if (durationString.includes("permanently")){
                length = 0
            }
            else{
                length = convertTime(durationString.substr(3))
                //console.log(length)
            }

            let endTime = timestamp + length

            // Finally grab reason, using the `` formatting.
            let reasonIndex1 = remainString.indexOf("`")
            let reasonIndex2 = remainString.lastIndexOf("`")
            let reason = remainString.substring(reasonIndex1 + 1, reasonIndex2)

            // Now format the JSON object.
            let dataObj = {
                "case": caseNumber,
                "action": "ban",
                "length": length,
                "endTime": endTime,
                "reason": reason,
                "mod": moderator,
                "timestamp": timestamp
            }

            // Now add it to the table
            if (user in table["bans"]){
                table["bans"][user].push(dataObj)
            }
            else{
                table["bans"][user] = [dataObj]
            }

            return table
        }
        else if (actionString.includes("unmuted")){
            // Similar to unmuting, pretty easy.
            let dataObj = {
                "case": caseNumber,
                "action": "ummute",
                "reason": "None given",
                "mod": moderator,
                "timestamp": timestamp
            }

            if (user in table["bans"]){
                table["bans"][user].push(dataObj)
            }
            else{
                table["bans"][user] = [dataObj]
            }
            return table
        }
        else if (actionString.includes("muted")){
            let durationIndex = remainString.indexOf("with the reason")
            let durationString = remainString.substr(0, durationIndex).trim()
            let length = 0
            if (durationString.includes("permanently")){
                length = 0
            }
            else{
                length = convertTime(durationString.substr(3))
                //console.log(length)
            }

            let endTime = timestamp + length

            // Finally grab reason, using the `` formatting.
            let reasonIndex1 = remainString.indexOf("`")
            let reasonIndex2 = remainString.lastIndexOf("`")
            let reason = remainString.substring(reasonIndex1 + 1, reasonIndex2)

            let dataObj = {
                "case": caseNumber,
                "action": "mute",
                "length": length,
                "endTime": endTime,
                "reason": reason,
                "mod": moderator,
                "timestamp": timestamp
            }

            // Now add it to the table
            if (user in table["bans"]){
                table["bans"][user].push(dataObj)
            }
            else{
                table["bans"][user] = [dataObj]
            }
            return table
        }

        else if (actionString.includes("added a mod-note")){
            let reasonIndex1 = remainString.indexOf("`")
            let reasonIndex2 = remainString.lastIndexOf("`")
            let reason = remainString.substring(reasonIndex1 + 1, reasonIndex2)

            let dataObj = {
                "note": reason,
                "mod": moderator,
                "timestamp": timestamp
            }

            if (user in table["notes"]){
                table["notes"][user].push(dataObj)
            }
            else{
                table["notes"][user] = [dataObj]
            }


            return table
        }
        else if (actionString.includes("warned")){
            let expireDate = timestamp + 7889400000
            let reasonIndex1 = remainString.indexOf("`")
            let reasonIndex2 = remainString.lastIndexOf("`")
            let reason = remainString.substring(reasonIndex1 + 1, reasonIndex2)

            let dataObj = {
                "case": caseNumber,
                "action": "warn",
                "reason": reason,
                "timestamp": timestamp,
                "mod": moderator,
                "expireDate": expireDate

            }
            if (user in table["bans"]){
                table["bans"][user].push(dataObj)
            }
            else{
                table["bans"][user] = [dataObj]
            }

            return table
        }
        else if (actionString.includes("removed a warn")){
            // we know the case number, we now just need to find it and remove it.
            let userRef = table["bans"][user]
            for (let i=0; i<userRef.length; i++){
                if (userRef[i].case == caseNumber){
                    userRef.splice(i, 1)
                    break
                }
            }
            return table
        }
        else{
            //console.log("ERROR: unknown action!")
            return table
        }

    }
}

async function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms))
}
