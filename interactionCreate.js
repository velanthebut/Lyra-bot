const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const config = require('../config.json');
const db = require('../database');
const textos = require('../textos.json');

function validarImagem(url) {
  if (!url || url.trim() === '') return { ok: true, mensagem: 'Sem imagem' };
  const valido = /^(https?:\/\/.*\.(png|jpg|jpeg|gif|webp))(\?.*)?$/i.test(url);
  return { ok: valido, mensagem: valido ? '✅ Formato válido' : '⚠️ Link inválido! Use direto .png/.jpg/.gif' };
}

function substituir(texto, usuario, servidor) {
  return texto
    .replace(/{usuario}/g, usuario?.username || 'alguém')
    .replace(/{mencao}/g, usuario ? `<@${usuario.id}>` : '@alguém')
    .replace(/{servidor}/g, servidor?.name || 'servidor');
}

module.exports = async (client, interacao) => {
  if (!interacao.isStringSelectMenu()) return;
  await interacao.deferUpdate().catch(() => {});

  const cat = interacao.values[0];
  let embed, menu;

  if (cat === 'cat_boasvindas' || cat.startsWith('bv_')) {
    const canal = interacao.guild.channels.cache.get(db.getConfig('bv_canal'));
    const ativo = db.getConfig('bv_ativo', 'sim');
    const usarEmbed = db.getConfig('bv_embed', 'sim');
    const imagem = db.getConfig('bv_imagem', '');
    const dmAtivo = db.getConfig('bv_dm', 'não');
    const imgCheck = validarImagem(imagem);

    embed = new EmbedBuilder()
      .setColor(config.corPadrao)
      .setTitle('👋 Boas-Vindas')
      .addFields(
        { name: 'Ativado', value: ativo === 'sim' ? '✅ Sim' : '❌ Não', inline: true },
        { name: 'Canal', value: canal ? `${canal}` : '❌ Não definido', inline: true },
        { name: 'Usar Embed', value: usarEmbed === 'sim' ? '✅ Sim' : '❌ Não', inline: true },
        { name: 'Imagem', value: imagem ? imgCheck.mensagem : 'Nenhuma', inline: true },
        { name: 'Mensagem na DM', value: dmAtivo === 'sim' ? '✅ Sim' : '❌ Não', inline: true },
        { name: 'Texto', value: `\`${db.getConfig('bv_texto', textos.boasVindas.padraoCanal)}\``.slice(0, 1024) }
      )
      .setFooter({ text: 'Para alterar, use: --setbv opção valor' });

    menu = new StringSelectMenuBuilder()
      .setCustomId('sub_bv')
      .setPlaceholder('Escolha o que alterar...')
      .addOptions(
        { label: 'Ativar/Desativar', value: 'bv_ativo', emoji: '🔌' },
        { label: 'Definir Canal', value: 'bv_canal', emoji: '📌' },
        { label: 'Texto do Canal', value: 'bv_texto', emoji: '✏️' },
        { label: 'Usar Embed', value: 'bv_embed', emoji: '🖼️' },
        { label: 'Imagem', value: 'bv_imagem', emoji: '📷' },
        { label: 'Mensagem na DM', value: 'bv_dm', emoji: '💌' },
        { label: 'Texto da DM', value: 'bv_dmtexto', emoji: '💬' }
      );

  } else if (cat === 'cat_despedida' || cat.startsWith('sd_')) {
    const canal = interacao.guild.channels.cache.get(db.getConfig('sd_canal'));
    const ativo = db.getConfig('sd_ativo', 'sim');
    const usarEmbed = db.getConfig('sd_embed', 'sim');
    const imagem = db.getConfig('sd_imagem', '');
    const dmAtivo = db.getConfig('sd_dm', 'não');
    const imgCheck = validarImagem(imagem);

    embed = new EmbedBuilder()
      .setColor(config.corPadrao)
      .setTitle('👋 Despedida')
      .addFields(
        { name: 'Ativada', value: ativo === 'sim' ? '✅ Sim' : '❌ Não', inline: true },
        { name: 'Canal', value: canal ? `${canal}` : '❌ Não definido', inline: true },
        { name: 'Usar Embed', value: usarEmbed === 'sim' ? '✅ Sim' : '❌ Não', inline: true },
        { name: 'Imagem', value: imagem ? imgCheck.mensagem : 'Nenhuma', inline: true },
        { name: 'Mensagem na DM', value: dmAtivo === 'sim' ? '✅ Sim' : '❌ Não', inline: true },
        { name: 'Texto', value: `\`${db.getConfig('sd_texto', textos.despedida.padraoCanal)}\``.slice(0, 1024) }
      )
      .setFooter({ text: 'Para alterar, use: --setsd opção valor' });

    menu = new StringSelectMenuBuilder()
      .setCustomId('sub_sd')
      .setPlaceholder('Escolha o que alterar...')
      .addOptions(
        { label: 'Ativar/Desativar', value: 'sd_ativo', emoji: '🔌' },
        { label: 'Definir Canal', value: 'sd_canal', emoji: '📌' },
        { label: 'Texto do Canal', value: 'sd_texto', emoji: '✏️' },
        { label: 'Usar Embed', value: 'sd_embed', emoji: '🖼️' },
        { label: 'Imagem', value: 'sd_imagem', emoji: '📷' },
        { label: 'Mensagem na DM', value: 'sd_dm', emoji: '💌' },
        { label: 'Texto da DM', value: 'sd_dmtexto', emoji: '💬' }
      );

  } else if (cat === 'cat_niveis' || cat.startsWith('nivel_')) {
    const ativo = db.getConfig('nivel_ativo', 'sim');
    const canal = interacao.guild.channels.cache.get(db.getConfig('nivel_canal'));
    const mensagem = db.getConfig('nivel_mensagem', textos.niveis.subiuNivel);
    const semXP = db.prepare('SELECT canalId FROM canais_sem_xp').all().map(c => `<#${c.canalId}>`).join(', ') || 'Nenhum';
    const mults = db.prepare('SELECT cargoId, multiplicador FROM multiplicador_xp').all();
    const listaMult = mults.length ? mults.map(m => `<@&${m.cargoId}>: ${m.multiplicador}x`).join('\n') : 'Nenhum';

    embed = new EmbedBuilder()
      .setColor(config.corPadrao)
      .setTitle('⭐ Sistema de Níveis')
      .addFields(
        { name: 'Status', value: ativo === 'sim' ? '✅ Ativado' : '❌ Desativado', inline: true },
        { name: 'Canal de Aviso', value: canal ? `${canal}` : '📤 Canal da mensagem', inline: true },
        { name: 'Mensagem de Subida', value: `\`${mensagem}\``.slice(0, 1024) },
        { name: '🚫 Canais sem XP', value: semXP },
        { name: '✨ Multiplicadores', value: listaMult }
      )
      .setFooter({ text: 'Use --setup level para comandos de configuração' });

    menu = new StringSelectMenuBuilder()
      .setCustomId('sub_nivel')
      .setPlaceholder('Escolha...')
      .addOptions(
        { label: 'Ativar/Desativar', value: 'nivel_ativo', emoji: '🔌' },
        { label: 'Canal de Aviso', value: 'nivel_canal', emoji: '📌' },
        { label: 'Mensagem de Subida', value: 'nivel_msg', emoji: '✏️' },
        { label: 'Bloquear Canal de XP', value: 'nivel_bloquear', emoji: '🚫' },
        { label: 'Desbloquear Canal', value: 'nivel_desbloquear', emoji: '✅' },
        { label: 'Multiplicador de XP', value: 'nivel_mult', emoji: '💎' },
        { label: 'Recompensas de Nível', value: 'nivel_recompensas', emoji: '🎁' }
      );

  } else if (cat === 'cat_moderacao') {
    const canalLog = interacao.guild.channels.cache.get(db.getConfig('mod_canalLog'));
    const dmPunicoes = db.getConfig('mod_dmPunicoes', 'sim');

    embed = new EmbedBuilder()
      .setColor(config.corPadrao)
      .setTitle('🛡️ Moderação')
      .addFields(
        { name: 'Canal de Logs', value: canalLog ? `${canalLog}` : '❌ Não definido', inline: true },
        { name: 'DM em Punições', value: dmPunicoes === 'sim' ? '✅ Enviar' : '❌ Não enviar', inline: true }
      );

    menu = new StringSelectMenuBuilder()
      .setCustomId('sub_mod')
      .setPlaceholder('Escolha...')
      .addOptions(
        { label: 'Canal de Logs', value: 'mod_canalLog', emoji: '📝' },
        { label: 'DM em Punições', value: 'mod_dmPunicoes', emoji: '💌' }
      );

  } else if (cat === 'cat_ajuda') {
    embed = new EmbedBuilder()
      .setColor(config.corPadrao)
      .setTitle('📖 Comandos da Lyra')
      .addFields(
        { name: '⚙️ Configuração', value: '`--setup` `--setup level` `--setup welcome` `--setup farewell`' },
        { name: '🛡️ Moderação', value: '`--ban` `--kick` `--mute` `--unmute` `--warn` `--clear` `--punicoes`' },
        { name: '⭐ Níveis', value: '`--rank` `--top`' },
        { name: 'ℹ️ Geral', value: '`--ajuda`' }
      )
      .setFooter({ text: 'Prefixo: -- | Feito com carinho 💜' });
    return await interacao.followUp({ embeds: [embed], ephemeral: true });
  }

  if (embed && menu) {
    await interacao.followUp({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    });
  }
};
