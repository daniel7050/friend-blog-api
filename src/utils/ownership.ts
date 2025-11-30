import prisma from "../generated/config/prisma";

export const findComment = async (commentId: number) =>
  await prisma.comment.findUnique({ where: { id: Number(commentId) } });

export const isCommentOwner = async (commentId: number, userId: number) => {
  const comment = await findComment(commentId);
  if (!comment) return null;
  return comment.authorId === Number(userId);
};

export default { findComment, isCommentOwner };
