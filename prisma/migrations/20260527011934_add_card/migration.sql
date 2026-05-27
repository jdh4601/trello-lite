-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Card_listId_position_idx" ON "Card"("listId", "position");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE;
