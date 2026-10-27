# Upload

## Placement

```text
shared/ui/FileUploader/
shared/ui/ImageUploader/      # optional specialized
shared/ui/DocumentUploader/
shared/ui/AvatarUploader/
```

## Responsibilities

Validate type/size, preview, progress, retry, remove, single/multiple, map to id/url via `onUpload`.

## API (conceptual)

```tsx
<FileUploader
  accept={['image/png', 'image/jpeg']}
  maxSize={5 * MB}
  maxCount={1}
  onUpload={uploadFile}
/>
```

## Rules

- Upload HTTP stays in feature/shared api helpers; component stays presentational + UX state.
- Do not copy-paste upload widgets per feature.
- Use platform primitives for buttons/progress — no direct kit imports in features.
- Client-side type/size checks are UX only. Server validation, filename handling,
  and SVG/HTML preview rules: `frontend-admin-security/references/upload-security.md`.
