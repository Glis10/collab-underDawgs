import { asyncHandler } from "@/utils/api/asyncHandler";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import ApiError from "@/utils/api/ApiError";
import { or, eq, is } from "drizzle-orm";
import db from "@/db";
import {
  loginServiceProviderSchema,
  newServiceProviderSchema,
  organization,
  TServiceProvider,
  serviceProvider,
} from "@/db/schema";
import ApiResponse from "@/utils/api/ApiResponse";
import { generateOtpToken } from "@/utils/tokens/otpTokens";
import { getOtpMessage } from "@/constants";
import twilioClient from "@/utils/services/twilio";
import { generateJWT } from "@/utils/tokens/jwtTokens";

// TODO Implement this method at one place only
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

const registerServiceProvider = asyncHandler(
  async (req: Request, res: Response) => {
    const parsedValues = newServiceProviderSchema.safeParse(req.body);

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

    if (
      parsedValues.data.phoneNumber &&
      /^[0-9]{10}$/.exec(parsedValues.data.phoneNumber.toString()) === null
    ) {
      throw new ApiError(400, "Invalid phone number");
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: or(
        eq(serviceProvider.phoneNumber, parsedValues.data.phoneNumber),
        eq(serviceProvider.email, parsedValues.data.email)
      ),
    });

    if (existingServiceProvider) {
      throw new ApiError(
        400,
        "Service Provider with this email or phone number already exists"
      );
    }

    const existingOrganization = await db.query.organization.findFirst({
      where: eq(organization.id, parsedValues.data.organizationId),
    });

    if (!existingOrganization) {
      throw new ApiError(404, "Organization not found");
    }

    if (
      existingOrganization.serviceCategory !== parsedValues.data.serviceType
    ) {
      throw new ApiError(
        400,
        "Service Type does not match with organization service category"
      );
    }

    const hashedPassword = await bcrypt.hash(parsedValues.data.password, 10);

    const newServiceProvider = await db
      .insert(serviceProvider)
      .values({ ...parsedValues.data, password: hashedPassword })
      .returning({
        name: serviceProvider.name,
        age: serviceProvider.age,
        phoneNumber: serviceProvider.phoneNumber,
        email: serviceProvider.email,
        primaryAddress: serviceProvider.primaryAddress,
        serviceType: serviceProvider.serviceType,
      });

    if (!newServiceProvider) {
      throw new ApiError(400, "Failed to register serviceProvider");
    }

    res.status(201).json(
      new ApiResponse(201, "serviceProvider registered successfully", {
        serviceProvider: newServiceProvider[0],
      })
    );
  }
);

const loginServiceProvider = asyncHandler(
  async (req: Request, res: Response) => {
    const parsedValues = loginServiceProviderSchema.safeParse(req.body);

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

    if (!parsedValues.data.phoneNumber) {
      throw new ApiError(400, "Phone number is required");
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.phoneNumber, parsedValues.data.phoneNumber),
      columns: {
        id: true,
        name: true,
        age: true,
        currentLocation: true,
        phoneNumber: true,
        email: true,
        password: true,
        isVerified: true,
      },
    });

    if (!existingServiceProvider) {
      throw new ApiError(
        404,
        "ServiceProvider not found with given credentials"
      );
    }

    const isPasswordValid = await bcrypt.compare(
      parsedValues.data.password,
      existingServiceProvider.password
    );

    if (!isPasswordValid) {
      throw new ApiError(400, "Invalid Credentials Provided");
    }

    if (existingServiceProvider && !existingServiceProvider.isVerified) {
      const otpToken = await sendOTP(
        String(existingServiceProvider.phoneNumber)
      );

      if (!otpToken) {
        throw new ApiError(300, "Error Sending OTP token. Please try again");
      }

      const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

      const servicePerson = await db
        .update(serviceProvider)
        .set({
          verificationToken: otpToken,
          tokenExpiry: tokenExpiry.toISOString(),
        })
        .where(eq(serviceProvider.id, existingServiceProvider.id));

      if (!servicePerson) {
        throw new ApiError(400, "Error setting verfication token");
      }

      return res.status(200).json(
        new ApiResponse(200, "OTP sent to serviceProvider for verification", {
          serviceProviderId: existingServiceProvider.id,
          otpToken,
        })
      );
    }

    const token = generateJWT(existingServiceProvider as TServiceProvider);

    const loggedInServiceProvider: Partial<TServiceProvider> = JSON.parse(
      JSON.stringify(existingServiceProvider)
    );
    delete loggedInServiceProvider.password;

    res
      .status(200)
      .cookie("token", token)
      .json(
        new ApiResponse(200, "ServiceProvider logged in successfully", {
          token,
          serviceProvider: loggedInServiceProvider,
        })
      );
  }
);

const logoutServiceProvider = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInServiceProvider = req.user;

    if (!loggedInServiceProvider || !loggedInServiceProvider.id) {
      throw new ApiError(401, "Unauthorized");
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, loggedInServiceProvider.id),
      columns: {
        id: true,
        name: true,
        phoneNumber: true,
        email: true,
        age: true,
        primaryAddress: true,
      },
    });

    if (!existingServiceProvider) {
      throw new ApiError(401, "Unauthorized Service Provider");
    }

    res
      .status(200)
      .clearCookie("token")
      .json(
        new ApiResponse(200, "Service Provider logged out successfully", {})
      );
  }
);

const verifyServiceProvider = asyncHandler(
  async (req: Request, res: Response) => {
    const { otpToken, serviceProviderId } = req.body;

    if (!otpToken) {
      throw new ApiError(400, "Please provide OTP");
    }

    if (!serviceProviderId) {
      throw new ApiError(400, "Please provide serviceProvider ID");
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, serviceProviderId),
      columns: {
        password: false,
      },
    });

    if (!existingServiceProvider) {
      throw new ApiError(400, "ServiceProvider not found");
    }

    if (
      !existingServiceProvider.verificationToken ||
      !existingServiceProvider.tokenExpiry
    ) {
      throw new ApiError(400, "Verification token not found");
    }

    if (!existingServiceProvider.tokenExpiry) {
      throw new ApiError(
        400,
        "Verification token expiry not registered. Please verify again."
      );
    }

    const tokenExpiry = new Date(existingServiceProvider.tokenExpiry);
    const currentTime = new Date(Date.now()).toISOString();

    if (new Date(currentTime) < tokenExpiry) {
      throw new ApiError(400, "Verification token expired");
    }

    if (otpToken !== existingServiceProvider.verificationToken) {
      throw new ApiError(400, "Invalid OTP");
    }

    const updatedServiceProvider = await db
      .update(serviceProvider)
      .set({
        isVerified: true,
        verificationToken: null,
        tokenExpiry: null,
      })
      .returning({
        id: serviceProvider.id,
        name: serviceProvider.name,
        phoneNumber: serviceProvider.phoneNumber,
        isVerified: serviceProvider.isVerified,
      });

    if (!updatedServiceProvider.length) {
      throw new ApiError(500, "Failed to verify serviceProvider");
    }

    res.status(200).json(
      new ApiResponse(200, "ServiceProvider verified successfully", {
        serviceProvider: updatedServiceProvider[0],
      })
    );
  }
);

const updateServiceProvider = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInServiceProvider = req.user;

    if (!loggedInServiceProvider || !loggedInServiceProvider.id) {
      throw new ApiError(401, "Unauthorized");
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, loggedInServiceProvider.id),
    });

    if (!existingServiceProvider) {
      throw new ApiError(401, "Unauthorized");
    }

    const updateData = req.body;

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, "No data to update");
    }

    const invalidKeys = Object.keys(updateData).filter(
      (key) => !Object.keys(serviceProvider).includes(key)
    );

    if (invalidKeys.length > 0) {
      throw new ApiError(
        400,
        `Invalid data to update. Invalid keys: ${invalidKeys}`
      );
    }

    const updatedServiceProvider = await db
      .update(serviceProvider)
      .set(updateData)
      .where(eq(serviceProvider.id, existingServiceProvider.id))
      .returning({
        id: serviceProvider.id,
        name: serviceProvider.name,
        phoneNumber: serviceProvider.phoneNumber,
        age: serviceProvider.age,
        email: serviceProvider.email,
        primaryAddress: serviceProvider.primaryAddress,
      });

    if (!updatedServiceProvider.length) {
      throw new ApiError(500, "Failed to update serviceProvider");
    }

    res.status(200).json(
      new ApiResponse(200, "ServiceProvider updated successfully", {
        serviceProvider: updatedServiceProvider[0],
      })
    );
  }
);

// TODO Implement this method
const deleteServiceProvider = asyncHandler(
  async (req: Request, res: Response) => {}
);

const forgotServiceProviderPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      throw new ApiError(400, "Please provide phone number");
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.phoneNumber, phoneNumber),
    });

    if (!existingServiceProvider) {
      throw new ApiError(
        404,
        "ServiceProvider not found with given phone number"
      );
    }

    const otpToken = await sendOTP(String(phoneNumber));

    if (!otpToken) {
      throw new ApiError(300, "Error Sending OTP token. Please try again");
    }

    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const servicePerson = await db.update(serviceProvider).set({
      resetPasswordToken: otpToken,
      resetPasswordTokenExpiry: tokenExpiry.toISOString(),
    });

    if (!servicePerson) {
      throw new ApiError(400, "Error setting reset password token");
    }

    res.status(200).json(
      new ApiResponse(200, "OTP sent to serviceProvider for verification", {
        serviceProviderId: existingServiceProvider.id,
        otpToken,
      })
    );
  }
);

const resetServiceProviderPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { otpToken, serviceProviderId, password } = req.body;

    if (!otpToken) {
      throw new ApiError(400, "Please provide OTP");
    }

    if (!serviceProviderId) {
      throw new ApiError(400, "Please provide serviceProvider ID");
    }

    if (!password) {
      throw new ApiError(400, "Please provide password");
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, serviceProviderId),
      columns: {
        password: false,
      },
    });

    if (!existingServiceProvider) {
      throw new ApiError(400, "ServiceProvider not found");
    }

    if (
      !existingServiceProvider.resetPasswordToken ||
      !existingServiceProvider.resetPasswordTokenExpiry
    ) {
      throw new ApiError(400, "Reset password token not found");
    }

    if (!existingServiceProvider.resetPasswordTokenExpiry) {
      throw new ApiError(
        400,
        "Reset password token expiry not registered. Please verify again."
      );
    }

    const tokenExpiry = new Date(
      existingServiceProvider.resetPasswordTokenExpiry
    );
    const currentTime = new Date(Date.now()).toISOString();

    if (new Date(currentTime) < tokenExpiry) {
      throw new ApiError(400, "Reset password token expired");
    }

    if (otpToken !== existingServiceProvider.resetPasswordToken) {
      throw new ApiError(400, "Invalid OTP");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updatedServiceProvider = await db
      .update(serviceProvider)
      .set({
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      })
      .returning({
        id: serviceProvider.id,
        name: serviceProvider.name,
        phoneNumber: serviceProvider.phoneNumber,
      });

    if (!updatedServiceProvider.length) {
      throw new ApiError(500, "Failed to reset password");
    }

    res.status(200).json(
      new ApiResponse(200, "Password reset successfully", {
        serviceProvider: updatedServiceProvider[0],
      })
    );
  }
);

const getServiceProviderProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInServiceProvider = req.user;

    if (!loggedInServiceProvider || !loggedInServiceProvider.id) {
      throw new ApiError(401, "Unauthorized");
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, loggedInServiceProvider.id),
    });

    if (!existingServiceProvider) {
      throw new ApiError(404, "Service Provider not found");
    }

    res.status(200).json(
      new ApiResponse(200, "Service Provider found successfully", {
        serviceProvider: existingServiceProvider,
      })
    );
  }
);

const getServiceProvider = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const loggedInServiceProvider = req.user;

  if (
    !loggedInServiceProvider ||
    !loggedInServiceProvider.id ||
    loggedInServiceProvider.role !== "admin"
  ) {
    throw new ApiError(401, "Unauthorized");
  }

  const existingServiceProvider = await db.query.serviceProvider.findFirst({
    where: eq(serviceProvider.id, id),
  });

  if (!existingServiceProvider) {
    throw new ApiError(404, "Service Provider not found");
  }

  res.status(200).json(
    new ApiResponse(200, "Service Provider found successfully", {
      serviceProvider: existingServiceProvider,
    })
  );
});

export {
  registerServiceProvider,
  loginServiceProvider,
  logoutServiceProvider,
  verifyServiceProvider,
  updateServiceProvider,
  deleteServiceProvider,
  resetServiceProviderPassword,
  forgotServiceProviderPassword,
  getServiceProviderProfile,
  getServiceProvider,
};
