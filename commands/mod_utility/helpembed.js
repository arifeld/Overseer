const { Command } = require("discord.js-commando");
const { RichEmbed } = require('discord.js'); // required for message embedding.



module.exports = class HelpEmbed extends Command {
	constructor(client) {
		super(client, {
			name: "helpembed",
			group: "mod_utility",
			memberName: "helpembed",
			description: "",
            ownerOnly: true
		})
	}


	run(msg){
        var helpInfo = [
            ["Argentina: :flag_ar:", "Phone: +5402234930430\nWeb: <https://www.casbuenosaires.com.ar/ayuda>"],
            ["Australia: :flag_au:", "Phone: 131114\nKids Helpline Phone: 1800 55 1800\nWeb: <https://www.lifeline.org.au/Get-Help/Online-Services/crisis-chat>\n"],
            ["Austria: :flag_at:", "Phone for children and young people: 147; for others 142\nWeb: <http://www.onlineberatung-telefonseelsorge.at>"],
            ["Belgium: :flag_be:", "Phone: 1813\nWeb: <https://www.zelfmoord1813.be>"],
            ["Bosnia and Herzegovina: :flag_ba:", "Phone: 080 05 03 05"],
            ["Botswana: :flag_bw:", "Phone: 3911270"],
            ["Brazil: :flag_br:", "Phone: 188\nWeb: <https://www.cvv.org.br>"],
            ["Canada: :flag_ca:", "Phone (in Montreal): 18662773553\nPhone (outside Montreal): 18662773553\nWeb (all): <http://www.crisisservicescanada.ca/en/need-help/looking-for-local-resources-support>"],
            ["Croatia: :flag_hr:", "Phone: 014833888"],
            ["Denmark: :flag_dk:", "Phone: +4570201201"],
            ["Egypt: :flag_eg:", "Phone: 7621602"],
            ["Estonia: :flag_ee:", "Phone: 3726558088\nPhone (Russian language): 3726555688"],
            ["Finland: :flag_fi:", "Phone: 010 195 202\nWeb: <https://mieli.fi/fi/tukea-ja-apua/kriisipuhelin-keskusteluapua-numerossa-09-2525-0111>"],
            ["Fiji: :flag_fj:", "Phone: 132454"],
            ["France: :flag_fr:", "Phone: 0800 32 123\nWeb: <http://www.preventionsuicide.be/fr/lesuicide.html>"],
            ["Germany/Deutschland: :flag_de:", "Phone (General): 08001810771\nPhone (Telefonseelsorge): 0800-1110111 or 0800-1110222\nWeb: <http://www.telefonseelsorge.de>"],
            ["Greece: :flag_gr:", "Phone: 1018\nPhone: 801 801 99 99\nWeb: <http://www.suicide-help.gr>"],
            ["Hong Kong: :flag_hk:", "Phone: +852 2382 0000"],
            ["Hungary: :flag_hu:", "Phone: 116123"],
            ["Iceland: :flag_is:", "Phone: 1717"],
            ["India: :flag_in:", "Phone: 8888817666"],
            ["Ireland: :flag_ie:", "Phone: +4408457909090"],
            ["Italy: :flag_it:", "Phone: 800860022\nWeb: <http://www.telefonoamico.it>\nWeb: <http://www.samaritansonlus.org>"],
            ["Iran, :flag_ir:", "Phone: 1480 (6am to 9pm)"],
            ["Ireland: :flag_ie:", "Phone: 1850 60 90 90\nPhone (minicom): 1850 60 90 91"],
            ["Israel: :flag_il:", "Phone: 1201\nWeb: <http://www.eran.org.il>\nWeb (Hebrew): <http://www.sahar.org.il>\nWeb (Arabic): <http://www.sahar.org.il/?categoryId=63068>"],
            ["Japan: :flag_jp:", "Phone (all regions): +810352869090\nPhone (Tokyo, Japanese): 3 5286 9090\nPhone (Tokyo, English): 03-5774-0992\nPhone (Osaka, Japanese): 06-6260-4343 <http://www.spc-osaka.org>\nWeb (Tokyo, Japanese): <http://www.befrienders-jap.org>\nWeb (Tokyo, English): <http://www.telljp.com>"],
            ["Korea: :flag_kr:", "Phone (Lifeline): 1588-9191\nPhone (Suicide Prevention Hotline): 1577-0199\nWeb: <http://www.lifeline.or.kr>"],
            ["Malta: :flag_mt:", "Phone: 179"],
            ["Mexico: :flag_mx:", "Phone: 5255102550\nWeb: <http://www.saptel.org.mx>"],
            ["Netherlands: :flag_nl:", "Phone (General): 0900 0113\nPhone (Holland): 09000767\nWeb: <https://www.113.nl>"],
            ["New Zealand: :flag_nz:", "Phone (outside Auckland): 0800543353\nPhone (inside Auckland): 09 5222 999"],
            ["Norway: :flag_no:", "Phone (General): +4781533300\nPhone (Kirkens SOS): 22 40 00 40\nWeb (Kirkens SOS): <http://www.kirkens-sos.no>"],
            ["Philippines: :flag_ph:", "Phone: 028969191"],
            ["Poland: :flag_pl:", "Phone: 5270000"],
            ["Portugal: :flag_pt:", "Phone (SOS Voz Amiga - 4pm to 12am): 21 354 45 45 or 91 280 26 29 or 96 352 46 60\nPhone (Telefone da Amizade - 4pm to 11pm): 22 832 35 35 or 808 22 33 53\n Web (SOS Voz Amiga): <http://www.sosvozamiga.org>\nWeb (Telefone da Amizade): <http://www.telefone-amizade.pt>"],
            ["Russia: :flag_ru:", "Phone: 0078202577577"],
            ["Romania: :flag_ro:", "Phone: 0800 801 200"],
            ["Spain: :flag_es:", "Phone: 914590050\nWeb: <http://www.telefonodelaesperanza.org>"],
            ["Serbia: :flag_rs:", "Phone: 0800 300 303\nPhone: 021 6623 393"],
            ["South Africa: :flag_za:", "Phone (General): 0514445691\nPhone (Lifeline): 0861 322 322\n Phone (Suicide Crisis Line): 0800 567 567"],
            ["Sweden: :flag_se:", "Phone: 46317112400\nWeb: <https://www.1177.se/liv--halsa/psykisk-halsa/att-soka-stod-och-hjalp/rad-och-stod-pa-chatt-och-telefon/>"],
            ["Switzerland: :flag_ch:", "Phone: 143"],
            ["United Kingdom: :flag_gb:", "Phone (General): 08457909090\nPhone (Samaritans - 24/7 free call, does not show on phone bills): 116 123\nPhone (Helplines for Men): 0800 58 58 58\nPhone (ChildLine - for those 19 and under): 0800-11-11\nWeb (Samaritans): <http://www.samaritans.org>\nWeb (Helplines for Men): <https://www.thecalmzone.net/help/get-help>\nWeb: (ChildLine): <http://www.childline.org.uk/Talk/Chat/Pages/OnlineChat.aspx>"],
            ["United States of America: :flag_us:", "Phone: 18002738255\nPhone (National Suicide Prevention Lifeline): 1-800-273-8255\nCrisis Text Line: Text 'START' to 741-741\nWeb: <http://chat.suicidepreventionlifeline.org/GetHelp/LifelineChat.aspx>"]

        ]

        const embed = new RichEmbed()
            .setColor(0x00FF00)
            .addField("**These are various links to helplines and websites per country.**", "If you are feeling depressed or angry and need some help, please seek it :)")
        msg.embed(embed)

        for (var i=0; i<helpInfo.length; i++){
            const embed = new RichEmbed()
                .setColor(0xFFFFFF)
                .addField("**" + helpInfo[i][0] + "**", helpInfo[i][1])
            msg.embed(embed)
        }
	}
}
