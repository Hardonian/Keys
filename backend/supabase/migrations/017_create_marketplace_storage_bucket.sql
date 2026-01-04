-- Create Supabase Storage bucket for marketplace assets
-- This bucket stores pack ZIPs, preview HTML, covers, and changelogs

-- Create the marketplace bucket (private by default)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketplace',
  'marketplace',
  false, -- Private bucket (signed URLs required)
  104857600, -- 100MB file size limit
  ARRAY[
    'application/zip',
    'application/x-zip-compressed',
    'text/html',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'text/markdown',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy: Service role can upload/delete
CREATE POLICY "Service role can upload to marketplace"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'marketplace' AND
  auth.jwt() ->> 'role' = 'service_role'
);

CREATE POLICY "Service role can delete from marketplace"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'marketplace' AND
  auth.jwt() ->> 'role' = 'service_role'
);

-- Create storage policy: Service role can update
CREATE POLICY "Service role can update marketplace files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'marketplace' AND
  auth.jwt() ->> 'role' = 'service_role'
)
WITH CHECK (
  bucket_id = 'marketplace' AND
  auth.jwt() ->> 'role' = 'service_role'
);

-- Note: Public read is NOT enabled - all access via signed URLs
-- Signed URLs are generated server-side after entitlement checks
