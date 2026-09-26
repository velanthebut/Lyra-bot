const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  nome: 'unmute',
  aliases: ['dessilenciar', 'desmutar', 'removersilenciamento'],
  descricao: 'Remover o silenciamento de um usuário',

  executar: async (client, msg, args) => {
    if (!msg.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return msg.reply('❌ Você precisa da permissão `Moderate Members` para usar este comando.');

    const alvo = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]);

    if (!alvo)
      return msg.reply('🔔 Este comando remove o silenciamento do usuário!\nEu preciso que você me informe quem deseja liberar.\n**Fica assim:**\n`--unmute @user`');

    if (!alvo.isCommunicationDisabled())
      return msg.reply(`✅ **${alvo.user.tag}** agora está livre novamente!`);

    if (!alvo.moderatable)
      return msg.reply('❌ Não consigo agir nesse usuário! Verifique se meu cargo está acima do dele.');

    await alvo.timeout(null, `Silenciamento removido por: ${msg.author.tag}`);

    await msg.reply('✅ Pronto! O registro foi atualizado no histórico do servidor.');
  }
};
