<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GetTakaful Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <!-- Logo Header -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 30px;">
                            <img src="{{ config('app.frontend_url') }}/img/logo.png" alt="getTakaful" style="max-width: 280px; height: auto;" />
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 0 40px 40px; color: #333333; font-size: 15px; line-height: 1.7;">
                            <p style="margin: 0 0 16px;">Dear User,</p>

                            <p style="margin: 0 0 16px;">
                                You have been invited to join a group on GetTakaful, a Shariah-compliant insurance platform that
                                allows users to collaborate and support one another.
                            </p>

                            <p style="margin: 0 0 8px;">To join the group, please click on the link below:</p>

                            <p style="margin: 0 0 24px;">
                                <a href="{{ $joinUrl }}" style="color: #00b4a0; text-decoration: underline; word-break: break-all;">{{ $joinUrl }}</a>
                            </p>

                            <p style="margin: 0; color: #666666;">
                                If you have any questions or require assistance, feel free to contact our support team.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;">
                            &copy; {{ date('Y') }} GetTakaful. All rights reserved.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
