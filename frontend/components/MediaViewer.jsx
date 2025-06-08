import React from 'react';

export default function MediaViewer({ src, type }) {
  if (!src) return null;

  const renderMedia = () => {
    if (type.startsWith('image/')) {
      return <img src={src} alt="media" className="max-w-full max-h-[70vh] mx-auto rounded" />;
    }
    if (type.startsWith('video/')) {
      return (
        <video controls className="w-full max-h-[70vh] mx-auto rounded">
          <source src={src} type={type} />
          Your browser does not support the video tag.
        </video>
      );
    }
    if (type.startsWith('audio/')) {
      return (
        <audio controls className="w-full">
          <source src={src} type={type} />
          Your browser does not support the audio tag.
        </audio>
      );
    }
    return <p>Unsupported media type: {type}</p>;
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded shadow">
      {renderMedia()}
    </div>
  );
}
