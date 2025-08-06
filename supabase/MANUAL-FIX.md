# Corrección Manual para RLS en bet_images

Ejecuta este SQL en el **SQL Editor** de tu dashboard de Supabase:

## 1. Deshabilitar RLS temporalmente
```sql
ALTER TABLE public.bet_images DISABLE ROW LEVEL SECURITY;
```

## 2. Verificar estado
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'bet_images';
```

## 3. Crear bucket si no existe
```sql
-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'bet-images';

-- Si no existe, insertar manualmente:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'bet-images',
    'bet-images',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;
```

## 4. Configurar políticas de storage
```sql
-- Políticas para el bucket bet-images
CREATE POLICY "Authenticated users can upload bet images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'bet-images');

CREATE POLICY "Authenticated users can view bet images" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'bet-images');

CREATE POLICY "Users can delete their own bet images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'bet-images' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## 5. Después del testing, reactivar RLS (opcional)
```sql
-- Solo si quieres reactivar RLS después
ALTER TABLE public.bet_images ENABLE ROW LEVEL SECURITY;

-- Y crear política simple
CREATE POLICY "bet_images_authenticated_all" ON public.bet_images
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

**EJECUTA LOS PASOS 1, 2 y 3 AHORA en tu dashboard de Supabase, luego prueba subir una imagen.**