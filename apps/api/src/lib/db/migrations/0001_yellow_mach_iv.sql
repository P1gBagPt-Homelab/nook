DROP INDEX "idx_catalog_barcode";--> statement-breakpoint
CREATE UNIQUE INDEX "idx_catalog_barcode" ON "product_catalog" USING btree ("household_id","barcode");