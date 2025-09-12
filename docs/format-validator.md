# Message Format Validator

This feature allows the bot to validate messages in specific channels according to predefined formats. When a message doesn't match the required format, the bot will post a notification informing the user about the error.

## Setup

Use the `/format-validator` command in the channel where you want to enforce message formatting:

```
/format-validator command:enable pattern:"YOUR_REGEX_PATTERN" error_message:"YOUR_ERROR_MESSAGE"
```

For example:
```
/format-validator command:enable pattern:"^\[.+\] .+$" error_message:"Votre message ne suit pas le format requis. Les messages dans ce channel doivent commencer par un texte entre crochets, par exemple: [Sujet] Mon message"
```

## Command Options

The format validator command has three subcommands:

- `enable`: Activates message format validation in the current channel
  - `pattern`: A regular expression pattern that defines the valid message format
  - `error_message`: The message that will be sent when a user's message doesn't match the pattern

- `disable`: Deactivates message format validation in the current channel

- `status`: Checks if message format validation is active in the current channel and shows the current settings

## Common Format Patterns

Here are some examples of patterns you can use:

### Message with Category in Brackets

Example format: `[Category] Message content`
Pattern: `^\\[.+\\] .+$`

### Message with Version Number

Example format: `v1.2.3 Message content`
Pattern: `^v\\d+\\.\\d+\\.\\d+ .+$`

### Message with Prefix Tag

Example format: `#help I need assistance`
Pattern: `^#\\w+ .+$`

### Message with ISO Date

Example format: `2023-01-15 Meeting notes`
Pattern: `^\\d{4}-\\d{2}-\\d{2} .+$`

## How It Works

1. When a message is sent in a channel with format validation enabled, the bot checks if the message content matches the defined pattern.
2. If the message doesn't match the pattern, the bot sends a notification mentioning the user and explaining the error.
3. The notification is automatically deleted after 30 seconds to keep the channel clean.

## Notes

- Only users with the "Manage Channels" permission can enable or disable message format validation.
- Format validation settings are stored in memory and will reset when the bot restarts.
- Make sure the bot has permission to read messages and send messages in the channels where format validation is enabled.
- You can define different format rules for different channels by running the command in each channel.
- The bot will only validate messages in channels where format validation has been explicitly enabled.
