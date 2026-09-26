const { EmbedBuilder } = require('discord.js');
const db = require('../database');
const textos = require('../textos.json');
const config = require('../config.json');

function substituir(texto, usuario, servidor) {
  return texto
    .replace(/{usuario}/g, usuario.username)
    .replace(/{mencao}/g, `<@${usuario.id}>`)
    .replace(/{servidor}/g, servidor.name);
}

module.exports = async (client, membro) => {
  if (db.getConfig('bv_ativo', 'sim') !== 'sim') return;

  const canal = membro.guild.channels.cache.get(db.getConfig('bv_canal'));
  const usarEmbed = db.getConfig('bv_embed', 'sim') === 'sim';
  const texto = substituir(db.getConfig('bv_texto', textos.boasVindas.padraoCanal), membro.user, membro.guild);
  const imagem = db.getConfig('bv_imagem');

  if (canal) {
    if (usarEmbed) {
      const embed = new EmbedBuilder()
        .setColor(config.corPadrao)
        .setTitle('🌸 Bem-vindo(a)!')
        .setDescription(texto)
        .setThumbnail(membro.user.displayAvatarURL())
        .setTimestamp();
      if (imagem) embed.setImage(imagem);
      await canal.send({ embeds: [embed] }).catch(() => {});
    } else {
      await canal.send(texto).catch(() => {});
    }
  }

  if (db.getConfig('bv_dm', 'não') === 'sim') {
    const textoDM = substituir(db.getConfig('bv_dmtexto', textos.boasVindas.padraoDM), membro.user, membro.guild);
    await membro.send(textoDM).catch(() => {});
  }
};
