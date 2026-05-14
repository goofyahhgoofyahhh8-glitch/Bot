require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");

const OpenAI = require("openai");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const commands = [
  new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask AI")
    .addStringOption(option =>
      option
        .setName("question")
        .setDescription("Ask something")
        .setRequired(true)
    )
].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Registering slash commands...");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("Commands registered.");
  } catch (error) {
    console.error(error);
  }
})();

client.once("ready", () => {
  console.log(`${client.user.tag} is online.`);
});

client.on("interactionCreate", async interaction => {

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ask") {

    const question = interaction.options.getString("question");

    await interaction.deferReply();

    try {

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a Discord AI bot."
          },
          {
            role: "user",
            content: question
          }
        ]
      });

      const answer = response.choices[0].message.content;

      const embed = new EmbedBuilder()
        .setColor("Blue")
        .setTitle("🤖 AI Response")
        .addFields(
          {
            name: "Question",
            value: question
          },
          {
            name: "Answer",
            value: answer
          }
        )
        .setTimestamp();

      await interaction.editReply({
        embeds: [embed]
      });

    } catch (err) {

      console.error(err);

      interaction.editReply("❌ AI failed.");
    }
  }
});

client.login(process.env.TOKEN);
