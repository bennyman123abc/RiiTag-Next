import path from 'node:path';
import fs from 'node:fs';
import Canvas from 'canvas';
import { CACHE, DATA, PUBLIC } from '@/lib/constants/filePaths';
import { exists, saveFile } from '@/lib/utils/fileUtils';
import ModuleBase from './ModuleBase';
import logger from '@/lib/logger';
import { EventEmitter } from "node:events";

async function loadFonts() {
    const fontJsons = await fs.promises.readdir(DATA.FONTS);
  
    await Promise.all(
      fontJsons.map(async (fontJson) => {
        const font = JSON.parse(
          await fs.promises.readFile(path.resolve(DATA.FONTS, fontJson), 'utf8')
        );
  
        font.styles.map(async (fontStyle) => {
          Canvas.registerFont(path.resolve(DATA.FONTFILES, fontStyle.file), {
            family: font.family,
            weight: fontStyle.weight,
            style: fontStyle.style,
          });
        });
      })
    );
  }

export async function renderTag(user) {
    await loadFonts();
    const overlayPath = path.resolve(DATA.OVERLAYS, `neo.${user.overlay}.json`);

    if (!(await exists(overlayPath))) throw new Error(`Overlay ${overlayPath} does not exist`);
    const overlay = JSON.parse(fs.readFileSync(overlayPath, 'utf-8'));

    const canvas = new Canvas.Canvas(overlay.width, overlay.height);
    var context = canvas.getContext('2d');

    var finished = 0;

    const elements: ModuleBase[] = await Promise.all(overlay.draw_order.map(async (element) => {
      var moduleName = await import(`@/lib/riitag/neo/std/${element}`);
      var module: ModuleBase = new moduleName.default(overlay);
      logger.info(`Building render element: ${element}; for ${user.username}`);
      // that's a grammatical nightmare dipshit
      // why are you restarting it?

      return module;
    }));

    for (const element of elements) {
      await element.render(context, user);
      finished++;
      logger.info(`Finished: ${finished}/${overlay.draw_order.length}`);
    }

    await saveFile(path.resolve(CACHE.TAGS, `neo.${user.username}.max.png`), canvas.createPNGStream());
}