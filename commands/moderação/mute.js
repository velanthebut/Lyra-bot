const { PermissionFlagsBits } = require('discord.js');
const db = require('../../database');

function converterTempo(texto) {
  const match = texto?.match(/^(\d+)([smhd])$/i);
  if (!match) return null;
  const valor = parseInt(match[1]);
  const unidade = match[2].toLowerCase();
  if (unidade === 's') return valor * 1000;
  if (unidade === 'm') return valor * 60 * 1000;
  if (unidade === 'h') return valor * 60 * 60 * 1000;
  if (unidade === 'd') return valor * 24 * 60 * 60 * 1000;
}

function formatarTempo(ms) {
  if (ms < 60000) return `${Math.floor(ms / 1000)} segundo${ms >= 2000 ? 's' : ''}`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)} minuto${ms >= 120000 ? 's' : ''}`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)} hora${ms >= 7200000 ? 's' : ''}`;
  return `${Math.floor(ms / 86400000)} dia${ms >= 172800000 ? 's' : ''}`;
}

module.exports = {
  nome: 'mute',
  aliases: ['silenciar', 'mutar'],
  descricao: 'Silenciar um usuário por um tempo',

  executar: async (client, msg, args) => {
    if (!msg.member.permissions.has(PermissionFlagsBits.ModerateMembers))
      return msg.reply('❌ Você precisa da permissão `Moderate Members` para usar este comando.');

    const alvo = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]);
    const duracao = converterTempo(args[1]);
    const motivo = args.slice(2).join(' ') || 'Sem motivo informado';

    if (!alvo || !duracao || duracao > 2419200000)
      return msg.reply('🔔 Este comando silencia o usuário por um tempo determinado!\nEu preciso que você me informe quem, por quanto tempo, e se desejar, o motivo.\n**Fica assim:**\n`--mute @user 30m perturbando o chat`\n*Eu vou entender se você usar `s` para seg, `m` para min... Até um máximo de 28 dias!*');

    if (alvo.id === msg.author.id)
      return msg.reply('❌ Você vai se silenciar? Vou fingir que não li isso...');

    if (alvo.roles.highest.position >= msg.member.roles.highest.position && msg.guild.ownerId !== msg.author.id)
      return msg.reply('⚠️ Esse usuário tem um cargo igual ou maior que o seu, não posso deixar você fazer isso.');

    if (!alvo.moderatable)
      return msg.reply('❌ Não consigo silenciar esse usuário! Verifique se meu cargo está acima do dele.');

    const tempoFormatado = formatarTempo(duracao);

    await alvo.send(`Você foi silenciado(a) em **${msg.guild.name}** por **${tempoFormatado}**.\nMotivo: ${motivo}`).catch(() => {});

    db.prepare(`
      INSERT INTO punicoes (usuarioId, moderadorId, tipo, motivo)
      VALUES (?, ?, 'mute', ?)
    `).run(alvo.id, msg.author.id, `${tempoFormatado} — ${motivo}`);

    await alvo.timeout(duracao, `${motivo} | Aplicado por: ${msg.author.tag}`);

    await msg.reply('✅ Punição aplicada! O registro foi adicionado ao histórico do servidor.');
  }
};
