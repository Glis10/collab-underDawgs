import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { eq, or } from "drizzle-orm";

import db from "@/db";
import ApiError from "@/utils/ApiError";
import twilioClient from "@/utils/twilio";
import ApiResponse from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { newUserSchema, user, loginUserSchema, TUser } from "@/db/schema/user";
import { generateJWT, verifyJWT } from "@/utils/jwtTokens";
import { generateOtpToken } from "@/utils/otpTokens";
import { getOtpMessage } from "@/constants";
import { adminEmails } from "@/config";
import { capitalizeFirstLetter } from "@/utils";

const sendOTP = async (phoneNumber: string): Promise<string | null> => {
  const otpToken = generateOtpToken(phoneNumber);
  const otpMessage = getOtpMessage(otpToken);

  // ! hardcoded the country code here
  const toPhoneNumber = `+977${phoneNumber}`;

  if (process.env.NODE_ENV === "production") {
    try {
      await twilioClient.messages.create({
        from: "+1 567 364 6291",
        to: toPhoneNumber,
        body: otpMessage,
      });
      console.log("Sending OTP Successfull", otpToken);
      return otpToken;
    } catch (error: any) {
      console.log("Error Sending OTP", error);
      throw new Error("Error Sending OTP. Please try again later");
    }
  }

  return otpToken;
};

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, phoneNumber, age, email, password, primaryAddress, role } =
    req.body;

  const parsedValues = newUserSchema.safeParse({
    name,
    phoneNumber,
    age,
    email,
    password,
    primaryAddress,
  });

  if (role && role == "admin" && !adminEmails.includes(email)) {
    throw new ApiError(401, "Admin email not authorized");
  }

  if (phoneNumber && /^[0-9]{10}$/.exec(phoneNumber) === null) {
    throw new ApiError(400, "Invalid phone number");
  }

  if (!parsedValues.success) {
    const validationError = new ApiError(
      400,
      "Error validating data",
      parsedValues.error.errors.map(
        (error) => `${error.path[0]} : ${error.message} `
      )
    );

    return res.status(400).json(validationError);
  }

  const existingUser = await db.query.user.findFirst({
    where: or(eq(user.phoneNumber, phoneNumber), eq(user.email, email)),
  });

  if (existingUser) {
    throw new ApiError(
      400,
      "User with this email or phone number already exists"
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await db
    .insert(user)
    .values({ ...parsedValues.data, password: hashedPassword })
    .returning({
      name: user.name,
      age: user.age,
      phoneNumber: user.phoneNumber,
      email: user.email,
      primaryAddress: user.primaryAddress,
    });

  if (!newUser) {
    throw new ApiError(400, "Error registering user. Please try again");
  }

  res
    .status(201)
    .json(
      new ApiResponse(201, "User registered successfully", { user: newUser[0] })
    );
});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { phoneNumber, email, password } = req.body;

  // TODO: check the validation schema
  const parsedValues = loginUserSchema.safeParse(req.body);

  if (!parsedValues.success) {
    const validationError = new ApiError(
      400,
      "Error validating data",
      parsedValues.error.errors.map(
        (error) => `${error.path[0]} : ${error.message} `
      )
    );

    return res.status(400).json(validationError);
  }

  const existingUser = await db.query.user.findFirst({
    where: or(eq(user.phoneNumber, phoneNumber), eq(user.email, email)),
    columns: {
      id: true,
      name: true,
      phoneNumber: true,
      email: true,
      age: true,
      primaryAddress: true,
      role: true,
      password: true,
      isVerfied: true,
    },
  });

  if (!existingUser) {
    throw new ApiError(400, "User not found");
  }

  const isPasswordValid = await bcrypt.compare(password, existingUser.password);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid credentials");
  }

  if (!existingUser.isVerfied) {
    const otpToken = await sendOTP(String(existingUser.phoneNumber));

    if (!otpToken) {
      throw new ApiError(300, "Error Sending OTP token. Please try again");
    }

    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const updatedUser = await db
      .update(user)
      .set({
        verificationToken: otpToken,
        tokenExpiry: tokenExpiry.toISOString(),
      })
      .where(eq(user.id, existingUser.id));

    if (!updatedUser) {
      throw new ApiError(400, "Error Updating user. Please try again");
    }

    return res.status(200).json(
      new ApiResponse(200, "OTP sent to user for verification", {
        userId: existingUser.id,
        otpToken,
      })
    );
  }

  const token = generateJWT(existingUser);
  const loggedInUser: Partial<TUser> = JSON.parse(JSON.stringify(existingUser));
  delete loggedInUser.password;

  res
    .status(200)
    .cookie("token", token)
    .json(
      new ApiResponse(
        200,
        `${capitalizeFirstLetter(
          loggedInUser.role?.toString() ?? "user"
        )} logged in successfully`,
        {
          user: loggedInUser,
          token,
        }
      )
    );
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || !loggedInUser.id) {
    throw new ApiError(401, "Unauthorized");
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, loggedInUser.id),
    columns: {
      id: true,
      name: true,
      phoneNumber: true,
      email: true,
      age: true,
      primaryAddress: true,
    },
  });

  if (!existingUser) {
    throw new ApiError(401, "Unauthorized User");
  }

  res
    .status(200)
    .clearCookie("token")
    .json(
      new ApiResponse(200, "User logged out successfully", {
        user: existingUser,
      })
    );
});

const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || !loggedInUser.id) {
    throw new ApiError(401, "Unauthorized");
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, loggedInUser.id),
  });

  if (!existingUser) {
    throw new ApiError(401, "Unauthorized");
  }
  const updateData = req.body;

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No data to update");
  }

  const invalidKeys = Object.keys(updateData).filter(
    (key) => !Object.keys(user).includes(key)
  );

  if (invalidKeys.length > 0) {
    throw new ApiError(
      400,
      `Invalid data to update. Invalid keys: ${invalidKeys}`
    );
  }

  const updatedUser = await db
    .update(user)
    .set(updateData)
    .where(eq(user.id, loggedInUser.id))
    .returning({
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      age: user.age,
      email: user.email,
      primaryAddress: user.primaryAddress,
    });

  if (!updatedUser.length) {
    throw new ApiError(500, "Failed to update user");
  }

  res.status(200).json(
    new ApiResponse(200, "User updated successfully", {
      user: updatedUser[0],
    })
  );
});

const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || !loggedInUser.id) {
    throw new ApiError(401, "Unauthorized");
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, loggedInUser.id),
    columns: {
      password: false,
      verificationToken: false,
      tokenExpiry: false,
    },
  });

  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, "User found", { user: existingUser }));
});

const getUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const loggedInUser = req.user;

  if (!loggedInUser || loggedInUser.role !== "admin") {
    throw new ApiError(401, "User not authorized");
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: {
      password: false,
      verificationToken: false,
      tokenExpiry: false,
    },
  });

  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, "User fetched successfully", { user: existingUser })
    );
});

const verifyUser = asyncHandler(async (req: Request, res: Response) => {
  const { otpToken, userId } = req.body;

  if (!otpToken) {
    throw new ApiError(400, "Please provide OTP");
  }

  if (!userId) {
    throw new ApiError(400, "Please provide user ID");
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: {
      password: false,
    },
  });

  if (!existingUser) {
    throw new ApiError(400, "User not found");
  }

  if (!user.verificationToken || !user.tokenExpiry) {
    throw new ApiError(400, "Verification token not found");
  }

  if (!existingUser.tokenExpiry) {
    throw new ApiError(
      400,
      "Verification token expiry not registered. Please verify again."
    );
  }

  const tokenExpiry = new Date(existingUser.tokenExpiry);
  const currentTime = new Date(Date.now()).toISOString();

  if (new Date(currentTime) < tokenExpiry) {
    throw new ApiError(400, "Verification token expired");
  }

  if (otpToken !== existingUser.verificationToken) {
    throw new ApiError(400, "Invalid OTP");
  }

  const updatedUser = await db
    .update(user)
    .set({
      isVerfied: true,
      verificationToken: null,
      tokenExpiry: null,
    })
    .returning({
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerfied,
    });

  if (!updatedUser.length || !updatedUser[0].isVerified) {
    throw new ApiError(500, "Failed to verify user");
  }

  res.status(200).json(
    new ApiResponse(200, "User verified successfully", {
      user: updatedUser[0],
    })
  );
});

const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    throw new ApiError(400, "Please provide email or phone number");
  }

  const existingUser = await db.query.user.findFirst({
    where: or(eq(user.email, email), eq(user.phoneNumber, phoneNumber)),
  });

  if (!existingUser) {
    throw new ApiError(404, "User not found with given email or phone");
  }

  const otpToken = await sendOTP(String(existingUser.phoneNumber));

  if (!otpToken) {
    throw new ApiError(300, "Error Sending OTP token. Please try again");
  }

  const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

  const updatedUser = await db
    .update(user)
    .set({
      resetPasswordToken: otpToken,
      resetPasswordTokenExpiry: tokenExpiry.toISOString(),
    })
    .where(eq(user.id, existingUser.id));

  if (!updatedUser) {
    throw new ApiError(400, "Error setting verfication token");
  }

  res.status(200).json(
    new ApiResponse(200, "OTP sent to user for verification", {
      userId: existingUser.id,
      otpToken,
    })
  );
});

const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { otpToken, userId, password } = req.body;

  if (!otpToken) {
    throw new ApiError(400, "Please provide OTP");
  }

  if (!userId) {
    throw new ApiError(400, "Please provide user ID");
  }

  if (!password) {
    throw new ApiError(400, "Please provide new password");
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  if (!existingUser) {
    throw new ApiError(400, "User not found");
  }

  if (
    !existingUser.resetPasswordToken ||
    !existingUser.resetPasswordTokenExpiry
  ) {
    throw new ApiError(400, "Reset Password token not found");
  }

  if (!existingUser.resetPasswordTokenExpiry) {
    throw new ApiError(
      400,
      "Verification token expiry not registered. Please verify again."
    );
  }

  const tokenExpiry = new Date(existingUser.resetPasswordTokenExpiry);
  const currentTime = new Date(Date.now()).toISOString();

  if (new Date(currentTime) < tokenExpiry) {
    throw new ApiError(400, "Verification token expired");
  }

  if (otpToken !== existingUser.resetPasswordToken) {
    throw new ApiError(400, "Invalid OTP");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const updatedUser = await db
    .update(user)
    .set({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordTokenExpiry: null,
    })
    .returning({
      id: user.id,
      name: user.name,
      phoneNumber: user.phoneNumber,
      email: user.email,
    });

  if (!updatedUser.length) {
    throw new ApiError(500, "Failed to update user");
  }

  res.status(200).json(
    new ApiResponse(200, "Password reset successfully", {
      user: updatedUser[0],
    })
  );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  updateUser,
  getUser,
  verifyUser,
  getProfile,
  forgotPassword,
  resetPassword,
};
