const { EmbedBuilder } = require('discord.js');
const db = require('../database');
const textos = require('../textos.json');
const config = require('../config.json');

function substituir(texto, usuario, servidor) {
  return texto
    .replace(/{usuario}/g, usuario.username)
    .replace(/{servidor}/g, servidor.name);
}

module.exports = async (client, membro) => {
  if (db.getConfig('sd_ativo', 'sim') !== 'sim') return;

  const canal = membro.guild.channels.cache.get(db.getConfig('sd_canal'));
  const usarEmbed = db.getConfig('sd_embed', 'sim') === 'sim';
  const texto = substituir(db.getConfig('sd_texto', textos.despedida.padraoCanal), membro.user, membro.guild);
  const imagem = db.getConfig('sd_imagem');

  if (canal) {
    if (usarEmbed) {
      const embed = new EmbedBuilder()
        .setColor('#999999')
        .setDescription(texto)
        .setTimestamp();
      if (imagem) embed.setImage(imagem);
      await canal.send({ embeds: [embed] }).catch(() => {});
    } else {
      await canal.send(texto).catch(() => {});
    }
  }

  if (db.getConfig('sd_dm', 'não') === 'sim') {
    const textoDM = substituir(db.getConfig('sd_dmtexto', textos.despedida.padraoDM), membro.user, membro.guild);
    await membro.send(textoDM).catch(() => {});
  }
};
