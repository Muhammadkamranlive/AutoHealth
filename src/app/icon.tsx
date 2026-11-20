import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 18V11.2C4 9.4 5.2 7.8 7 7.2L12 5.5L17 7.2C18.8 7.8 20 9.4 20 11.2V18"
            stroke="white"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 18V13.5C7 12.7 7.7 12 8.5 12H15.5C16.3 12 17 12.7 17 13.5V18"
            stroke="white"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path
            d="M12 9.2V14.8M9.4 12H14.6"
            stroke="white"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
