const palette = { g:'#527e47',G:'#2d5338',l:'#91ad58',y:'#edc45d',o:'#bd7d3c',b:'#755137',k:'#293b31',s:'#edc998',w:'#f1ecd2',r:'#b65539',B:'#659ba4',a:'#a9d2c4',d:'#376779',e:'#7f857a',E:'#b7bba9',p:'#e58ca0',P:'#c4607a' };
const shapes = {
 tree:['......GGG.......','....GGgggGG.....','...GggglgggG....','..GgglgllgggG...','.GgglgggglgggG..','.GglgglggggggG..','..GgggglgglgG...','...GGgggggGG....','......bbb.......','......bob.......','.....bbobb......','...lllbbllll....'],
 person:['.....kkkk.......','....kkkkkk......','....ksssssk.....','.....sksks......','.....sssss......','....GsssssG.....','...oGGwwGGGo....','...oGGwwGGGo....','....GGGGGG......','.....b..b.......','....kk..kk......','...lll..lll.....'],
 grandpa:['.....wwww.......','....wwwwww......','....kssssk......','....skskss......','.....wwww.......','.....swws.......','...GGwwwwGG.....','...sGGGGGGs.....','...sGGGGGGs.....','....GGGGGG......','.....b..b.......','....kk..kk......'],
 woman:['.....kkkk.......','....kkkkrk......','...kksssskk.....','...kksskskk.....','....kssssk......','.....ssss.......','....rrwrrr......','...srrwrrrs.....','....rrrrrr......','...rrrrrrrr.....','.....k..k.......','....kk..kk......'],
 child:['....yyyyyy......','...yyyyyyyy.....','..yyyyyyyyyy....','....kssssk......','....ssksss......','.....ssss.......','....GwwGGG......','...sGwwGGGs.....','....GGGGGG......','.....b..b.......','....kk..kk......'],
 house:['......kkkk......','....kkddddkk....','..kkddddddddkk..','.kddddddddddddk.','..bbbbbbbbbbbb..','..bowwboowwbob..','..bowwboowwbob..','..bbbbbbbbbbbb..','..boobkkkboobb..','..boobkbkboobb..','..bbbbbbbbbbbb..','.lllbbbbbbbblll.'],
 pot:['.....oooooo.....','.....bbbbbb.....','....boooooob....','...boooooooob...','...boooooooob...','....boooooob....','.....bbbbbb.....'],
 grass:['..g.....g....g..','..gg..g.gg..gg..','.gggggggggggggg.','..GGggGGggGGgg..','...GGGGGGGGGG...'],
 post:['....rrrrrr......','...rrrrrrrr.....','...rkkkkkkr.....','...rrrrrrrr.....','...rrwwwwrr.....','...rrrrrrrr.....','....rrrrrr......','......bb........','......bb........'],
 well:['....bbbbbbbb....','...bwwwwwwwwb...','..bwwBddBBwwwb..','...bwwwwwwwwb...','...bbbbbobbbb...','...boobboobbb...','...bbbbbbbbbb...'],
 stump:['....oooooo......','...oyyyyyyo.....','...oyooooyo.....','...oyyyyyyo.....','...bbbbbbbb.....','...bobbbbob.....','..bbobbbbbb.....'],
 bird:['......bbbb......','....bbboobbb....','...booowkwoo....','...boooooooyy...','..boooooooob....','.boooobbbb......','..bbbbbb........','....o..o........','...ooo.ooo......'],
 water:['.......B........','......BaB.......','.....BaaaB......','....BaaaaaB.....','...BaaaaaaaB....','...BaawaaaaB....','...BaawaaaaB....','....BaaaaaB.....','.....BBBBB......','...aaaaaaaaa....'],
 sun:['.......o........','..o....o....o...','....oyyyyyoo....','...oyyyyyyyyo...','..oyyyyyyyyyyo..','oooyyykyykyyyooo','..oyyyyyyyyyyo..','...oyyyrryyyo...','....oyyyyyoo....','..o....o....o...','.......o........'],
 moon:['....kkkk........','...kyyyk........','..kyyyk.........','.kyyyk..........','.kyyyk..........','.kyyyk..........','..kyyyk.........','...kyyykkkk.....','....kyyyyyyk....','.....kkkkkk.....'],
 mouth:['...rr.....rr....','...rr.....rr....','....kkkkkk......','...krrrrrrk.....','...krrrrrrk.....','....krrrrk......','.....kkkk.......'],
 heart:['...rrr..rrr.....','..rrrrrrrrrr....','..rrrrrrrrrr....','...rrrrrrrr.....','....rrrrrr......','.....rrrr.......','......rr........'],
 mountain:['.......k........', '......kwk.......', '.....kwwwk......', '....kgwwggk.....', '...kggggggGk....', '..kgggGgggGGk...', '.kggGGggggGGGk..', 'kGGGGGGGGGGGGGGk'],
 stone:['................', '.....kkkkk......', '...kkEEEEekk....', '..kEEEeeeeeek...', '.kEEeeeeeeeeek..', '.keeeekeeeeeek..', '..keeeeeeeeek...', '...kkkkkkkkk....'],
 fire:['.......r........', '......rr........', '.....rror.......', '....rroyor......', '...rroyyyor.....', '...royyyyyor....', '...royywyyor....', '....royyyor.....', '.....rrrrr......', '...bb.bbb.bb....'],
 field:['.bbbbbbbbbbbbb..', '.bgggggbgggggb..', '.bglglgbglglgb..', '.bgggggbgggggb..', '.bbbbbbbbbbbbb..', '.bgggggbgggggb..', '.bglglgbglglgb..', '.bgggggbgggggb..', '.bbbbbbbbbbbbb..'],
 power:['.....kssk.......', '....ksssk.......', '....kssk..kk....', '...kssk..kssk...', '..kssk..kssssk..', '..kssskksssssk..', '..ksssssssssk...', '...kssssssssk...', '....kkkkkkkk....', '....rrrrrrrr....'],
 flower:['....pp..pp......', '...ppppppppp....', '....ppyyypp.....', '...pppyyyppp....', '....pp.p.pp.....', '.......G........', '....ll.G........', '.....llG.ll.....', '.......Gll......', '.......G........'],
 fish:['................', '.....BBBBB......', '...BBaaaaaB..B..', '..BawkaaaaaBBB..', '..BaaaaaaaaaBB..', '...BBaaaaaB..B..', '.....BBBBB......'],
 white:['................', '.....eeee.......', '...eewwwwee.....', '..ewwwwwwwwe....', '.ewwwwwwwwwwee..', 'ewwwwwwwwwwwwwe.', '.eeeeeeeeeeeee..'],
 shell:['......oooo......', '....oowwwwoo....', '...owoswoswo....', '..owsowsowsow...', '..osowsowsoso...', '...oooooooooo...', '.....oo..oo.....'],
 wind:['................', '.aaaaaaaaa......', '..........a.....', '.BBBBBBBBB.a....', '..........Ba....', '..aaaaaaaB......', '....BBBBBBBBB...', '.............B..', '..BBBBBBBBBBB...'],
 few:['.......o........', '......ooo.......', '.......o........', '...s.......s....', '..sss.....sss...', '...s...o...s....', '......ooo.......', '.......o........'],
 gate:['kkkkkkkkkkkkkkkk', '.rrrrrrrrrrrrrr.', '..rr........rr..', '..rrrrrrrrrrrr..', '..rr........rr..', '..rr........rr..', '..rr........rr..', '..rr........rr..', '.lll........lll.'],
 ear:['.....ssss.......', '....sooooss.....', '...soss..os.....', '...sos....os....', '...soss...os....', '....sos..os.....', '.....sooos......', '......sss.......'],
 eye:['................', '....kkkkkk......', '..kkwwwwwwkk....', '.kwwwBBBBwwwk...', '.kwwBBkkBBwwk...', '.kwwwBBBBwwwk...', '..kkwwwwwwkk....', '....kkkkkk......'],
 stand:['.......kk.......', '......kssk......', '.......ss.......', '.....GGGGGG.....', '....s.GGGG.s....', '.......GG.......', '......G..G......', '......k..k......', '..llllllllllll..'],
 ripple:['................', '.....aaaaa......', '...aa.....aa....', '..a..aaaaa..a...', '..a.a..w..a.a...', '..a..aaaaa..a...', '...aa.....aa....', '.....aaaaa......'],
 middle:['..GGGGGGGGGG....','..GllllllllG....','..GlwwwwwwlG....','..GlwwrrwwlG....','..GlwrrrrwlG....','..GlwrrrrwlG....','..GlwwrrwwlG....','..GlwwwwwwlG....','..GllllllllG....','..GGGGGGGGGG....'],
};
function svgPixels(rows) {
  let rects = '';
  rows.forEach((row,y) => [...row].forEach((c,x) => { if (palette[c]) rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${palette[c]}"/>`; }));
  return rects;
}
export function art(kind) {
  let body;
  if (kind === 'grove' || kind === 'forest') {
    const tree = svgPixels(shapes.tree);
    body = kind === 'grove' ? `<g transform="translate(-2 3) scale(.8)">${tree}</g><g transform="translate(6 2) scale(.8)">${tree}</g>` : `<g transform="translate(3 -1) scale(.8)">${tree}</g><g transform="translate(-2 4) scale(.8)">${tree}</g><g transform="translate(7 4) scale(.8)">${tree}</g>`;
  } else if (kind === 'friends') body = `<g transform="translate(-1 2) scale(.7)">${svgPixels(shapes.person)}</g><g transform="translate(7 2) scale(.7)">${svgPixels(shapes.person)}</g>`;
  else if (kind === 'rest') body = `<g transform="translate(5 0) scale(.8)">${svgPixels(shapes.tree)}</g><g transform="translate(-2 4) scale(.7)">${svgPixels(shapes.person)}</g>`;
  else body = svgPixels(shapes[kind] ?? shapes.tree);
  return `<svg viewBox="0 -1 16 15" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" shape-rendering="crispEdges">${body}</svg>`;
}
