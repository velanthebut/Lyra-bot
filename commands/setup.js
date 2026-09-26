const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');
const textos = require('../textos.json');
const db = require('../database');

module.exports = {
  nome: 'setup',
  aliases: ['configurar', 'conf'],
  executar: async (client, msg, args) => {
    if (!msg.member.permissions.has(PermissionFlagsBits.Administrator))
      return msg.reply(textos.sistema.semPermissao);

    const alvo = args[0]?.toLowerCase();

    if (alvo === 'level' || alvo === 'nivel' || alvo === 'niveis') {
      return abrirMenuNiveis(msg);
    }
    if (alvo === 'welcome' || alvo === 'boasvindas' || alvo === 'bv') {
      return abrirMenuBoasVindas(msg);
    }
    if (alvo === 'farewell' || alvo === 'despedida' || alvo === 'saida' || alvo === 'sd') {
      return abrirMenuDespedida(msg);
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId('menu_principal')
      .setPlaceholder('Escolha uma seção...')
      .addOptions(
        { label: '👋 Boas-Vindas', description: 'Mensagens, canal, imagem, DM', value: 'cat_boasvindas', emoji: '🌸' },
        { label: '👋 Despedida', description: 'Saída, canal, imagem, DM', value: 'cat_despedida', emoji: '🌿' },
        { label: '⭐ Níveis & Recompensas', description: 'Subida, cargos, multiplicadores', value: 'cat_niveis', emoji: '✨' },
        { label: '🛡️ Moderação', description: 'Logs, punições, avisos', value: 'cat_moderacao', emoji: '🔰' },
        { label: '📖 Ajuda', description: 'Lista de comandos', value: 'cat_ajuda', emoji: '📋' }
      );

    const embed = new EmbedBuilder()
      .setColor(config.corPadrao)
      .setTitle('Central de Configuração — Lyra 🌸')
      .setDescription(
        'Bem-vindo(a)! 💜 Escolha no menu abaixo\n\n' +
        '⚡ Atalhos rápidos:\n' +
        '`--setup level` → Sistema de Níveis\n' +
        '`--setup welcome` → Boas-Vindas\n' +
        '`--setup farewell` → Despedida'
      )
      .setThumbnail(client.user.displayAvatarURL())
      .setTimestamp();

    await msg.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
  }
};

async function abrirMenuNiveis(msg) {
  const ativo = db.getConfig('nivel_ativo', 'sim');
  const canal = msg.guild.channels.cache.get(db.getConfig('nivel_canal'));
  const mensagem = db.getConfig('nivel_mensagem', textos.niveis.subiuNivel);
  const semXP = db.prepare('SELECT canalId FROM canais_sem_xp').all().map(c => `<#${c.canalId}>`).join(', ') || 'Nenhum';
  const mults = db.prepare('SELECT cargoId, multiplicador FROM multiplicador_xp').all();
  const listaMult = mults.length ? mults.map(m => `<@&${m.cargoId}>: ${m.multiplicador}x`).join('\n') : 'Nenhum';

  const embed = new EmbedBuilder()
    .setColor(config.corPadrao)
    .setTitle('⭐ Sistema de Níveis — Lyra')
    .addFields(
      { name: 'Status', value: ativo === 'sim' ? '✅ Ativado' : '❌ Desativado', inline: true },
      { name: 'Canal de Aviso', value: canal ? `${canal}` : '📤 Canal da mensagem', inline: true },
      { name: 'Mensagem de Subida', value: `\`${mensagem}\``.slice(0, 1024) },
      { name: '🚫 Canais sem XP', value: semXP },
      { name: '✨ Multiplicadores', value: listaMult }
    )
    .setFooter({ text: 'Use os botões abaixo para configurar' });

  const menu = new StringSelectMenuBuilder()
    .setCustomId('cat_niveis')
    .setPlaceholder('O que deseja configurar?')
    .addOptions(
      { label: 'Ativar/Desativar', value: 'nivel_ativo', emoji: '🔌' },
      { label: 'Canal de aviso', value: 'nivel_canal', emoji: '📌' },
      { label: 'Mensagem de subida', value: 'nivel_msg', emoji: '✏️' },
      { label: 'Bloquear canal de XP', value: 'nivel_bloquear', emoji: '🚫' },
      { label: 'Desbloquear canal', value: 'nivel_desbloquear', emoji: '✅' },
      { label: 'Multiplicador de XP', value: 'nivel_mult', emoji: '💎' },
      { label: 'Recompensas de nível', value: 'nivel_recompensas', emoji: '🎁' }
    );

  await msg.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
}

async function abrirMenuBoasVindas(msg) {
  const canal = msg.guild.channels.cache.get(db.getConfig('bv_canal'));
  const ativo = db.getConfig('bv_ativo', 'sim');
  const usarEmbed = db.getConfig('bv_embed', 'sim');
  const imagem = db.getConfig('bv_imagem', '');
  const dm = db.getConfig('bv_dm', 'não');

  const embed = new EmbedBuilder()
    .setColor(config.corPadrao)
    .setTitle('👋 Boas-Vindas')
    .addFields(
      { name: 'Ativado', value: ativo === 'sim' ? '✅ Sim' : '❌ Não', inline: true },
      { name: 'Canal', value: canal ? `${canal}` : 'Não definido', inline: true },
      { name: 'Embed', value: usarEmbed === 'sim' ? '✅ Sim' : '❌ Não', inline: true },
      { name: 'Imagem', value: imagem ? '✅ Configurada' : 'Nenhuma', inline: true },
      { name: 'Mensagem na DM', value: dm === 'sim' ? '✅ Sim' : '❌ Não', inline: true }
    );

  const menu = new StringSelectMenuBuilder()
    .setCustomId('cat_boasvindas')
    .setPlaceholder('Escolha...')
    .addOptions(
      { label: 'Ativar/Desativar', value: 'bv_ativo', emoji: '🔌' },
      { label: 'Definir canal', value: 'bv_canal', emoji: '📌' },
      { label: 'Texto do canal', value: 'bv_texto', emoji: '✏️' },
      { label: 'Usar embed', value: 'bv_embed', emoji: '🖼️' },
      { label: 'Imagem', value: 'bv_imagem', emoji: '📷' },
      { label: 'Mensagem na DM', value: 'bv_dm', emoji: '💌' },
      { label: 'Texto da DM', value: 'bv_dmtexto', emoji: '💬' }
    );

  await msg.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
}

async function abrirMenuDespedida(msg) {
  const canal = msg.guild.channels.cache.get(db.getConfig('sd_canal'));
  const ativo = db.getConfig('sd_ativo', 'sim');
  const usarEmbed = db.getConfig('sd_embed', 'sim');
  const imagem = db.getConfig('sd_imagem', '');
  const dm = db.getConfig('sd_dm', 'não');

  const embed = new EmbedBuilder()
    .setColor(config.corPadrao)
    .setTitle('👋 Despedida')
    .addFields(
      { name: 'Ativada', value: ativo === 'sim' ? '✅ Sim' : '❌ Não', inline: true },
      { name: 'Canal', value: canal ? `${canal}` : 'Não definido', inline: true },
      { name: 'Embed', value: usarEmbed === 'sim' ? '✅ Sim' : '❌ Não', inline: true },
      { name: 'Imagem', value: imagem ? '✅ Configurada' : 'Nenhuma', inline: true },
      { name: 'Mensagem na DM', value: dm === 'sim' ? '✅ Sim' : '❌ Não', inline: true }
    );

  const menu = new StringSelectMenuBuilder()
    .setCustomId('cat_despedida')
    .setPlaceholder('Escolha...')
    .addOptions(
      { label: 'Ativar/Desativar', value: 'sd_ativo', emoji: '🔌' },
      { label: 'Definir canal', value: 'sd_canal', emoji: '📌' },
      { label: 'Texto do canal', value: 'sd_texto', emoji: '✏️' },
      { label: 'Usar embed', value: 'sd_embed', emoji: '🖼️' },
      { label: 'Imagem', value: 'sd_imagem', emoji: '📷' },
      { label: 'Mensagem na DM', value: 'sd_dm', emoji: '💌' },
      { label: 'Texto da DM', value: 'sd_dmtexto', emoji: '💬' }
    );

  await msg.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
}
