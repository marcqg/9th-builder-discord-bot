// Structure to hold format validation rules
export interface FormatValidationRule {
    guildId: string;
    channelId: string;
    pattern: string;
    errorMessage: string;
    enabled: boolean;
}

// In-memory storage for channel format validation rules
export class FormatValidationStore {
    private static rules: FormatValidationRule[] = [];

    // Add or update a validation rule for a channel
    public static setRule(
        guildId: string, 
        channelId: string, 
        pattern: string, 
        errorMessage: string
    ): FormatValidationRule {
        // Check if rule already exists for this channel
        const existingIndex = this.rules.findIndex(
            rule => rule.guildId === guildId && rule.channelId === channelId
        );

        const rule: FormatValidationRule = {
            guildId,
            channelId,
            pattern,
            errorMessage,
            enabled: true
        };

        // Update existing or add new rule
        if (existingIndex >= 0) {
            this.rules[existingIndex] = rule;
        } else {
            this.rules.push(rule);
        }

        return rule;
    }

    // Disable validation for a channel
    public static disableRule(guildId: string, channelId: string): boolean {
        const existingIndex = this.rules.findIndex(
            rule => rule.guildId === guildId && rule.channelId === channelId
        );

        if (existingIndex >= 0) {
            this.rules[existingIndex].enabled = false;
            return true;
        }
        
        return false;
    }

    // Get all active rules
    public static getActiveRules(): FormatValidationRule[] {
        return this.rules.filter(rule => rule.enabled);
    }

    // Get rule for a specific channel
    public static getRule(guildId: string, channelId: string): FormatValidationRule | undefined {
        return this.rules.find(
            rule => rule.guildId === guildId && rule.channelId === channelId
        );
    }
}
