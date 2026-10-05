import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";

function AshaniSplash({ onComplete }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);

      // Give the fade-out a little time
      setTimeout(() => {
        onComplete();
      }, 250);
    }, 1450);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,

        zIndex: 99999,

        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",

        backgroundColor: "#0B0B0F",

        animation:
          "ashaniSplashFade 0.25s ease forwards",
        animationDelay: "1.45s",

        "@keyframes ashaniSplashFade": {
          from: {
            opacity: 1,
          },
          to: {
            opacity: 0,
          },
        },
      }}
    >
      {/* =================================================
          ASHANI LOGO
         ================================================= */}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",

          mb: 5,

          animation:
            "ashaniLogoAppear 0.7s ease-out",

          "@keyframes ashaniLogoAppear": {
            from: {
              opacity: 0,
              transform: "translateY(8px) scale(0.96)",
            },
            to: {
              opacity: 1,
              transform: "translateY(0) scale(1)",
            },
          },
        }}
      >
        {/* Replace this with your actual Ashani logo if desired */}

        <Box
  component="img"
  src="/ashani-logo.png"
  alt="Ashani"
  sx={{
    width: 244,
    height: 244,
    objectFit: "contain",
    mb: 1,
  }}
/>

        <Typography
          sx={{
            color: "#F5F5F5",

            fontSize: "1.7rem",
            fontWeight: 600,

            letterSpacing: "-0.025em",
          }}
        >
          Ashani AI
        </Typography>
      </Box>

      {/* =================================================
          MOVING PARTICLES
         ================================================= */}

      <Box
        sx={{
          width: {
            xs: 230,
            sm: 300,
          },

          height: 40,

          position: "relative",

          overflow: "hidden",
        }}
      >
        {[0, 1, 2, 3, 4].map((index) => (
          <Box
            key={index}
            sx={{
              position: "absolute",

              width: 13,
              height: 13,

              borderRadius: "50%",

              backgroundColor: "#1E3A8A",

              boxShadow:
                "0 0 12px rgba(30, 58, 138, 0.65)",

              top: "50%",

              left: -20,

              transform: "translateY(-50%)",

              animation:
                "ashaniParticle 1.15s cubic-bezier(0.4, 0, 0.2, 1) infinite",

              animationDelay: `${index * 0.13}s`,

              "@keyframes ashaniParticle": {
                "0%": {
                  left: "-20px",
                  opacity: 0,
                  transform:
                    "translateY(-50%) scale(0.65)",
                },

                "15%": {
                  opacity: 1,
                },

                "45%": {
                  transform:
                    "translateY(-50%) scale(1)",
                },

                "70%": {
                  transform:
                    "translateY(-50%) scale(1.15)",
                },

                "100%": {
                  left: "calc(100% + 20px)",
                  opacity: 0,
                  transform:
                    "translateY(-50%) scale(0.65)",
                },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

export default AshaniSplash;