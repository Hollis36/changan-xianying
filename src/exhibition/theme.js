// Shared by the live artwork and newly generated prints.
export const galleryColors={paper:'#faf9f6',foreground:'#292d29',muted:'#62635b',accent:'#805944',rule:'#c3bdaf'};
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
export const galleryArtwork={
 saturation:1,tint:[1,1,1],background:rgb(galleryColors.paper),lightPaper:true,
 palette:Object.fromEntries(Object.entries({stone:'#77766d',brick:'#8a7159',jade:'#414d45',red:'#805944',gold:'#956f4f',wood:'#805944',light:'#626b60'}).map(([key,hex])=>[key,rgb(hex)]))
};
