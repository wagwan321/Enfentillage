const { test } = require('node:test');
const assert = require('node:assert/strict');
const { websiteCategory, KEYS } = require('../api/categorize');
const cat = (name, paths = []) => websiteCategory({ name, paths }).key;

test('every toy gets exactly one known website category', () => {
  for (const name of ['', 'SOMETHING UNKNOWN', 'LEGO – CITY FIRE STATION']) assert.ok(KEYS.includes(cat(name)));
});

test('pretend play is role play only (kitchens, doctor kits, tools, dollhouses, playhouses)', () => {
  assert.equal(cat('STEP2 – GREAT GOURMET KITCHEN', ['OUTDDOR / INDOOR > SCHOOLYARD & PLAY CENTER ADVENTURES > PLAYHOUSES']), 'pretend');
  assert.equal(cat('EDU FUN – FREYA WOODEN DOLLHOUSE 80 x 35 x 118 cm'), 'pretend');
  assert.equal(cat('SCIENCE4YOU – MY FIRST VETERINARY KIT'), 'pretend');
  assert.equal(cat('KID OBY – 3-IN-1 TOY TOOLS', ['TOYS > PRETEND PLAY > TOOL SETS & WORKSHOPS']), 'pretend');
  // character playsets that staff had ticked as "pretend play" are figures
  assert.equal(cat('NINTENDO – SONIC THE HEDGEHOG – COLLECTOR EDITION TAILS', ['TOYS > PRETEND PLAY > SET']), 'figures');
  assert.equal(cat('INTEX – POOL AND SPA VACUUM ZR100'), 'outdoor');
});

test('dolls, figures, plush and beauty are kept apart', () => {
  assert.equal(cat('DESIGN A FRIEND – 18 inch EVA PROM PRINCESS DOLL'), 'dolls');
  assert.equal(cat('BLOKEES – DAADOOS SANRIO CHARECTERS – MAGICAL KUROMI 2 (BLIND BOX)'), 'figures');
  assert.equal(cat('BLOKEES – STAR WARS CLASSIC CLASS 01 EVERGREEN MOVIE STORMTROOPER MODEL KIT', ['TOYS > BUILDING SETS > CONSTRUCTION']), 'building');
  assert.equal(cat('FIFA WORLD CUP 10 inch SOCCER BEAR', ['TOYS > PLUSH TOYS > SOFT PLUSH']), 'plush');
  assert.equal(cat('TOWNLEY – BARBIE LIP GLOSS SET WITH ACRYLIC STAND', ['TOYS > PRETEND PLAY > BEAUTY SET']), 'style');
  assert.equal(cat('PLAY-DOH – ZOOM ZOOM VACUUM & CLEANUP SET'), 'pretend');
  assert.equal(cat('PLAY-DOH – STARTER SET'), 'creative');
});

test('a WEBSITE category ticked in WooCommerce overrides the rules', () => {
  assert.equal(cat('NINTENDO – SONIC THE HEDGEHOG – COLLECTOR EDITION TAILS', ['TOYS > PRETEND PLAY > SET', 'WEBSITE > PRETEND PLAY']), 'pretend');
  assert.equal(cat('LEGO – CITY FIRE STATION', ['WEBSITE > GAMES & PUZZLES']), 'games');
});
