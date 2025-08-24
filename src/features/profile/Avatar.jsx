// src/features/profile/Avatar.jsx
export default function Avatar({ src, size = 64 }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <img
        src={src}
        alt="Avatar"
        className="h-full w-full rounded-full object-cover"
      />
  
    </div>
  );
}
