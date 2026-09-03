-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
