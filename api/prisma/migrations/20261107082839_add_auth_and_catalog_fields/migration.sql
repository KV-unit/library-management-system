/*
  Warnings:

  - You are about to drop the column `copies` on the `Book` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[isbn]` on the table `Book` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Genre` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `isbn` to the `Book` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Genre` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Book" DROP COLUMN "copies",
ADD COLUMN     "availableCopies" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isbn" TEXT NOT NULL,
ADD COLUMN     "totalCopies" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Genre" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL,
ALTER COLUMN "name" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Book_isbn_key" ON "Book"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");
