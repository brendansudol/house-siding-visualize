// Photo-derived window schedule; dimensions remain estimates, in model units.
// A count of two/three means a joined bank with one continuous outer casing.
// Separately cased windows are separate entries, even when aligned in a row.
const left = -Math.PI / 2, right = Math.PI / 2, rear = Math.PI;
export const windowLayout = [
  // IMG_0263 / IMG_0266: two upstairs pairs, a lower pair, and porch singles.
  {id:'front-upper-left',x:.91,y:5.31,z:3.94,width:.72,height:1.67,count:2,blinds:true,reference:'IMG_0263'},
  {id:'front-upper-right',x:3.10,y:5.31,z:3.94,width:.72,height:1.67,count:2,blinds:true,reference:'IMG_0263'},
  {id:'front-lower-right',x:2.98,y:2.31,z:3.94,width:.75,height:1.81,count:2,blinds:true,reference:'IMG_0263'},
  {id:'porch-left',x:-3.72,y:2.32,z:3.94,width:.70,height:1.91,reference:'IMG_0266'},
  {id:'porch-right',x:-.49,y:2.32,z:3.94,width:.70,height:1.91,reference:'IMG_0266'},
  // IMG_0267: three beside the porch, two below the cross-gable, two above.
  {id:'side-front-triple',x:-4.64,y:2.32,z:2.66,width:.65,height:1.84,count:3,rotation:left,blinds:true,reference:'IMG_0267'},
  {id:'side-middle-pair',x:-4.64,y:2.32,z:-.56,width:.73,height:1.84,count:2,rotation:left,blinds:true,reference:'IMG_0267'},
  {id:'side-upper-pair',x:-4.64,y:5.20,z:-.56,width:.69,height:1.70,count:2,rotation:left,reference:'IMG_0267'},
  {id:'side-basement-front',x:-4.64,y:.12,z:2.40,width:.50,height:.85,rotation:left,reference:'IMG_0267'},
  {id:'side-basement-middle',x:-4.64,y:.12,z:-.56,width:.50,height:.85,rotation:left,reference:'IMG_0267'},
  // The far end of the left wing and the right wall are not fully photographed.
  {id:'side-rear-pair',x:-4.64,y:2.30,z:-4.80,width:.69,height:1.69,count:2,rotation:left,inferred:true},
  ...[1.9,-1.6,-4.4].map((z,i)=>({id:`right-lower-${i+1}`,x:4.64,y:2.33,z,width:.75,height:1.72,rotation:right,inferred:true})),
  ...[1.35,-2.4].map((z,i)=>({id:`right-upper-${i+1}`,x:4.64,y:5.27,z,width:.73,height:1.62,rotation:right,inferred:true})),
  // IMG_0268: two distinct tall upper windows and five individual small ones.
  {id:'rear-upper-left',x:3.20,y:5.29,z:-5.54,width:.73,height:1.68,rotation:rear,reference:'IMG_0268'},
  {id:'rear-upper-right',x:1.32,y:5.29,z:-5.54,width:.73,height:1.68,rotation:rear,reference:'IMG_0268'},
  ...[3.20,1.32,-.35,-2.03,-3.70].map((x,i)=>({id:`rear-small-${i+1}`,x,y:2.80,z:-6.74,width:.63,height:.79,rotation:rear,reference:'IMG_0268'})),
  {id:'rear-low-fixed',x:2.86,y:1.32,z:-6.74,width:.89,height:.51,style:'fixed',rotation:rear,reference:'IMG_0268'},
  {id:'rear-basement',x:-.57,y:-.68,z:-4.74,width:.54,height:.87,rotation:rear,reference:'IMG_0268'}
];
