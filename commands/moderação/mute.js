const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../database');
const t = require('../../textos.json');
const cfg = require('../../config.json');

function converterTempo(texto) {
  const match = texto.match(/^(\d+)([smhd])$/i);
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
      return msg.reply(`❌ ${t.sistema.semPermissao}`);

    const alvo = msg.mentions.members.first() || msg.guild.members.cache.get(args[0]);
    const duracao = converterTempo(args[1]);
    const motivo = args.slice(2).join(' ') || 'Sem motivo informado';

    if (!alvo || !duracao || duracao > 2419200000) {
      return msg.reply(
        '💜 **Como usar:** `--mute @Usuário tempo motivo`\n' +
        'Exemplos: `--mute @Maria 30m Perturbando`\n' +
        'Unidades: `s` segundos | `m` minutos | `h` horas | `d` dias\n' +
        '⏳ Máximo: 28 dias'
      );
    }

    if (alvo.id === msg.author.id)
      return msg.reply('🤭 Silenciar a si mesmo? Não faz sentido, né? 😅');

    if (alvo.roles.highest.position >= msg.member.roles.highest.position && msg.author.id !== cfg.donoId)
      return msg.reply('⚠️ Esse usuário tem cargo igual ou maior que o seu!');

    if (!alvo.moderatable)
      return msg.reply('❌ Não consigo silenciar esse usuário!');

    const tempoFormatado = formatarTempo(duracao);

    if (db.getConfig('mod_dmPunicoes', 'sim') === 'sim') {
      const textoDM = t.moderação.mute.dm
        .replace(/{servidor}/g, msg.guild.name)
        .replace(/{tempo}/g, tempoFormatado)
        .replace(/{motivo}/g, motivo);
      await alvo.send(textoDM).catch(() => {});
    }

    db.prepare(`
      INSERT INTO punicoes (usuarioId, moderadorId, tipo, motivo)
      VALUES (?, ?, 'mute', ?)
    `).run(alvo.id, msg.author.id, `${tempoFormatado} — ${motivo}`);

    const embed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setAuthor({ name: t.moderação.mute.titulo, iconURL: msg.guild.iconURL() })
      .setThumbnail(alvo.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '👤 Usuário', value: `**${alvo.user.tag}**\n\`${alvo.id}\``, inline: true },
        { name: '⏱️ Duração', value: `**${tempoFormatado}**`, inline: true },
        { name: '🛡️ Moderador', value: `**${msg.author.tag}**`, inline: true },
        { name: '📝 Motivo', value: motivo }
      )
      .setFooter({ text: 'Expira automaticamente' })
      .setTimestamp();

    const canalLog = msg.guild.channels.cache.get(db.getConfig('mod_canalLog'));
    if (canalLog) await canalLog.send({ embeds: [embed] });

    await alvo.timeout(duracao, motivo);
    await msg.reply({ embeds: [embed] });
  }
};
