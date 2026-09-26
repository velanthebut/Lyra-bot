const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  nome: 'clear',
  aliases: ['limpar', 'apagar', 'purge'],
  descricao: 'Limpar mensagens do canal',

  executar: async (client, msg, args) => {
    if (!msg.member.permissions.has(PermissionFlagsBits.ManageMessages))
      return msg.reply('❌ Você precisa da permissão `Manage Messages` para usar este comando.');

    const quantidade = parseInt(args[0]);

    if (!quantidade || quantidade < 1 || quantidade > 1000)
      return msg.reply('🔔 Este comando apaga mensagens deste canal!\nEu preciso que você me informe quantas mensagens apagar.\n**Fica assim:**\n`--clear 20`\nEu consigo apagar até 1000 mensagens por vez!');

    await msg.delete().catch(() => {});

    let totalApagado = 0;
    let restante = quantidade;

    while (restante > 0) {
      const lote = await msg.channel.bulkDelete(Math.min(restante, 100), true);
      totalApagado += lote.size;
      restante -= 100;
      if (lote.size === 0) break;
    }

    const confirmacao = await msg.channel.send(`✅ Pronto! Apaguei **${totalApagado}** mensagens deste chat!`);
  }
};
