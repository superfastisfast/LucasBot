import type Fighter from "@/commands/Fight/fighter";
import type FightGame from "@/commands/Fight/fightGame";
import { Globals } from "@/index";
import { Item } from "@/models/item";
import { UserDB } from "@/models/user";
import type { AppUser } from "@/user";
import { createCanvas, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import { AttachmentBuilder, EmbedBuilder, type InteractionUpdateOptions } from "discord.js";

const BLOCK_WIDTH = 64;
const BLOCK_HEIGHT = 128;
const PFP_RATIO = 4;
const FONT = "Bangers";

async function loadImg(path: string) {
  try {
    return await loadImage(path);
  } catch {
    console.error(`Image load failed: ${path}`);
    return null;
  }
}

async function renderPlayers(ctx: SKRSContext2D, game: FightGame, border: CanvasImageSource | null) {
  const [a, b] = game.appUsers;
  await drawPlayer(ctx, a!, game.playerTurn === 1, false);
  await drawPlayer(ctx, b!, game.playerTurn === 0, true);

  async function drawPlayer(ctx: SKRSContext2D, user: AppUser, isCurrent: boolean, otherSide: boolean) {
    const fighter = user.fighter;
    const x = fighter.posX * BLOCK_WIDTH;
    const bodyPath = fighter.currentHealth > 0 ? "./assets/Gladiator.png" : "./assets/GladiatorDead.png";
    const bodyImg = await loadImg(bodyPath);
    if (bodyImg) ctx.drawImage(bodyImg, x, otherSide ? BLOCK_HEIGHT/2 : 0, BLOCK_WIDTH, BLOCK_HEIGHT);

    const size = BLOCK_WIDTH / PFP_RATIO;
    const posX = otherSide ? x + BLOCK_WIDTH - size : x;
    try {
      const avatar = await loadImage(user.discord.displayAvatarURL({ extension: 'png', size: size }));
      ctx.drawImage(avatar, posX, 0, size, size);
      if (isCurrent && border) ctx.drawImage(border as CanvasImageSource, posX, 0, size, size);
    } catch {
      ctx.fillStyle = "white";
      ctx.font = `${size}px ${FONT}`;
      ctx.textAlign = "center";
      ctx.fillText(user.database.username, posX + size/2, size/2);
    }
  }
}

async function renderAction(ctx: SKRSContext2D, game: FightGame, action: any) {
  ctx.font = `30px ${FONT}`;
  const current = game.getCurrentPlayer();
  const next = game.getNextPlayer();
  const mapIcon = async (icon: string, x: number, y: number, w: number, h: number) => {
    const img = await loadImg(`./assets/${icon}.png`);
    if (img) ctx.drawImage(img, x, y, w, h);
  };

  const dmg = action.damageTaken ?? 0;
  switch (action.type) {
    case 'attack':
      await mapIcon(dmg > 0 ? 'hearth' : 'block', next.posX*BLOCK_WIDTH, BLOCK_HEIGHT/5, BLOCK_WIDTH/2, BLOCK_WIDTH/2);
      if (dmg > 0) ctx.fillText(dmg.toFixed(1), next.posX*BLOCK_WIDTH + BLOCK_WIDTH/4, BLOCK_HEIGHT/5 + BLOCK_HEIGHT/10);
      break;
    case 'sleep':
      await mapIcon('hearth', current.posX*BLOCK_WIDTH, BLOCK_HEIGHT/5, BLOCK_WIDTH/2, BLOCK_WIDTH/2);
      ctx.fillText(`+${action.healthRegained?.toFixed(1)}`, current.posX*BLOCK_WIDTH + BLOCK_WIDTH/4, BLOCK_HEIGHT/5 + BLOCK_HEIGHT/10);
      break;
    case 'move':
      break;
    case 'escape':
      await mapIcon('escape', current.posX*BLOCK_WIDTH, BLOCK_HEIGHT/2, BLOCK_WIDTH, BLOCK_WIDTH);
      break;
  }
  if (['attack','move','sleep'].includes(action.type)) {
    await mapIcon('mana', current.posX*BLOCK_WIDTH, BLOCK_HEIGHT/2, BLOCK_WIDTH/2, BLOCK_WIDTH/2);
    ctx.fillText(action.type === 'move' ? '-1' : '-1', current.posX*BLOCK_WIDTH + BLOCK_WIDTH/4, BLOCK_HEIGHT/2 + BLOCK_HEIGHT/8);
  }
}

export async function getFieldImage(game: FightGame, action: any) {
  const width = game.arenaSize * BLOCK_WIDTH;
  const canvas = createCanvas(width, BLOCK_HEIGHT);
  const ctx = canvas.getContext('2d');
  const bg = await loadImg('./assets/SAS-Background.png');
  const border = await loadImg('./assets/border.png');

  for (let i=0; i<game.arenaSize; i++) {
    if (bg) ctx.drawImage(bg, i*BLOCK_WIDTH,0,BLOCK_WIDTH,BLOCK_HEIGHT);
    else ctx.fillRect(i*BLOCK_WIDTH,0,BLOCK_WIDTH,BLOCK_HEIGHT);
  }
  await renderPlayers(ctx, game, border);
  await renderAction(ctx, game, action);

  const buffer = await canvas.encode('png');
  return new AttachmentBuilder(buffer, { name: 'game-field.png' });
}

async function makeBar(current: number, max: number, len=10, code='31') {
  if (max <= 0) return ':no_entry_sign:';
  const filled = Math.round((current/max)*len);
  const empty = len - filled;
  return `${current.toFixed(2)}/${max.toFixed(2)}\`ansi
[2;${code}m${'█'.repeat(filled)}[0m[2;37m${' '.repeat(empty)}[0m
\``;
}

export async function getFightDisplay(game: FightGame, action: any): Promise<InteractionUpdateOptions> {
  const [p1, p2] = game.appUsers.map(u => u.fighter);
  const bars = await Promise.all([
    makeBar(p1.currentHealth, p1.getMaxHealthStats()),
    makeBar(p1.currentMana, p1.getMaxManaStats(), undefined, '34'),
    makeBar(p2.currentHealth, p2.getMaxHealthStats()),
    makeBar(p2.currentMana, p2.getMaxManaStats(), undefined, '34'),
  ]);

  const stats = async (f: Fighter) => {
    const keys = UserDB.StatDB.keys;
    return keys.map(k => {
      const name = Globals.ATTRIBUTES[k].emoji;
      const base = f.appUser.database.stats[k];
      const extra = (f.appUser.getStat(k as any) - base).toFixed(2);
      return `${name} ${Globals.ATTRIBUTES[k].name}: ${base} +${extra}`;
    }).join('\n');
  };

  const embed = new EmbedBuilder()
    .setColor(0x0099ff)
    .setAuthor({ name: `➡️ ${game.getNextPlayer().appUser.discord.displayName}'s Turn!`, iconURL: game.getNextPlayer().appUser.discord.avatarURL()! })
    .setImage('attachment://game-field.png')
    .addFields(
      { name: "Stats", value: await stats(p1), inline: true },
      { name: '\u200B', value: '\u200B', inline: true },
      { name: "Stats", value: await stats(p2), inline: true },
      { name: "Health", value: bars[0], inline: true },
      { name: '\u200B', value: '\u200B', inline: true },
      { name: "Health", value: bars[2], inline: true },
      { name: "Mana", value: bars[1], inline: true },
      { name: '\u200B', value: '\u200B', inline: true },
      { name: "Mana", value: bars[3], inline: true }
    )
    .setFooter({ text: `➡️ ${game.getNextPlayer().appUser.discord.displayName}'s Turn!`, iconURL: game.getNextPlayer().appUser.discord.avatarURL()! })
    .setTimestamp();

  const fieldAttachment = await getFieldImage(game, action);
  return { embeds: [embed], files: [fieldAttachment] };
}
