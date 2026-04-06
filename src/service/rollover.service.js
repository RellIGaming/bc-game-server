export const updateRollover = async(userId,betAmount)=>{

 await prisma.rollover.updateMany({
   where:{userId},
   data:{
     wagered:{increment:betAmount}
   }
 });

};