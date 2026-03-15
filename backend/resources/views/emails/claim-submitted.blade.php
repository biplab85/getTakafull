<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td align="center" style="padding: 40px 40px 30px;">
                            <img src="{{ config('app.frontend_url') }}/img/logo.png" alt="getTakaful" style="max-width: 280px; height: auto;" />
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 40px 40px; color: #333333; font-size: 15px; line-height: 1.7;">
                            <p style="margin: 0 0 16px;">Dear Group Owner,</p>

                            <p style="margin: 0 0 16px;">
                                A new claim has been submitted in your group <strong>{{ $claim->group->title }}</strong>.
                            </p>

                            <table style="width: 100%; border-collapse: collapse; margin: 0 0 20px;">
                                <tr>
                                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Claimant</td>
                                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: 600;">{{ $claim->claimant_name }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Amount Claimed</td>
                                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: 600;">CAD ${{ number_format($claim->amount_claimed, 2) }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #666;">Date of Incident</td>
                                    <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: 600;">{{ $claim->date_of_incident?->format('M d, Y') }}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666;">Policy Number</td>
                                    <td style="padding: 8px 0; font-weight: 600;">{{ $claim->policy_number }}</td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 8px;">Please review the claim and approve or reject it:</p>

                            <p style="margin: 0 0 24px;">
                                <a href="{{ $reviewUrl }}" style="display: inline-block; padding: 12px 28px; background: #00b4a0; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">Review Claim</a>
                            </p>

                            <p style="margin: 0; color: #666666; font-size: 13px;">
                                Or copy this link: <a href="{{ $reviewUrl }}" style="color: #00b4a0; word-break: break-all;">{{ $reviewUrl }}</a>
                            </p>
                        </td>
                    </tr>
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
