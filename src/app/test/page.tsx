"use client";

export default function TestPage() {
  return (
    <div className="bg-red-500 text-white p-8 m-4">
      <h1 className="text-4xl font-bold">Tailwind Test</h1>
      <p className="text-xl mt-4">If you see red background and white text, Tailwind is working!</p>
      <div className="bg-blue-500 p-4 mt-4 rounded">
        <p>This should be blue with rounded corners</p>
      </div>
    </div>
  );
}
