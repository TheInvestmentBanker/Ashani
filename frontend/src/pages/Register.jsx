import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Link,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import { useNavigate } from "react-router-dom";

import { registerUser } from "../services/api";
import { saveAuth } from "../services/auth";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (
      !username.trim() ||
      !email.trim() ||
      !password
    ) {
      setError(
        "Username, email, and password are required."
      );

      return;
    }

    setLoading(true);

    try {
      const data = await registerUser(
        username,
        email,
        password
      );

      saveAuth(
        data.token,
        data.user
      );

      navigate("/");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        px: 2,

        backgroundColor:
          "background.default",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 420,

          p: {
            xs: 3,
            sm: 4,
          },

          border: 1,
          borderColor: "divider",
          borderRadius: 4,

          backgroundColor:
            "background.paper",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 1,
          }}
        >
          Create your Ashani account
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Join Ashani for free.
        </Typography>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
          >
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          autoComplete="on"
        >
          <TextField
            fullWidth
            required

            label="Username"

            value={username}

            onChange={(event) =>
              setUsername(
                event.target.value
              )
            }

            autoComplete="username"

            autoFocus

            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            required

            label="Email"

            type="email"

            value={email}

            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }

            autoComplete="email"

            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            required

            label="Password"

            type="password"

            value={password}

            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }

            autoComplete="new-password"

            helperText="At least 8 characters"

            sx={{ mb: 3 }}
          />

          <Button
            fullWidth

            type="submit"

            variant="contained"

            size="large"

            disabled={loading}

            sx={{
              py: 1.3,

              borderRadius: 2.5,

              textTransform: "none",

              fontWeight: 600,
            }}
          >
            {loading ? (
              <CircularProgress
                size={24}
                color="inherit"
              />
            ) : (
              "Create free account"
            )}
          </Button>
        </Box>

        <Typography
          textAlign="center"
          color="text.secondary"
          sx={{ mt: 3 }}
        >
          Already have an account?{" "}

          <Link
            component="button"
            type="button"

            onClick={() =>
              navigate("/login")
            }

            underline="hover"
          >
            Log in
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}

export default Register;