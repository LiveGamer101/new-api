package discord

import (
	"fmt"
	"one-api/common"
	"one-api/controller"
	"one-api/model"
	"os"
	"strings"
	"time"

	"github.com/bwmarrin/discordgo"
)

var (
	Session  *discordgo.Session
	BotToken string
)

func IsAdmin(userId string) bool {
	return common.DiscordAdminIds[userId]
}

func AddAdmin(userId string) {
	common.DiscordAdminIds[userId] = true
}

func RemoveAdmin(userId string) {
	delete(common.DiscordAdminIds, userId)
}

func Init() error {

	var err error
	Session, err = discordgo.New("Bot " + BotToken)
	if err != nil {
		return fmt.Errorf("error creating Discord session: %v", err)
	}

	// Register slash commands
	commands := []*discordgo.ApplicationCommand{
		{
			Name:        "channels",
			Description: "List all channels and their status",
			Options: []*discordgo.ApplicationCommandOption{
				{
					Type:        discordgo.ApplicationCommandOptionString,
					Name:        "status",
					Description: "Filter by status (active/inactive/disabled)",
					Required:    false,
					Choices: []*discordgo.ApplicationCommandOptionChoice{
						{
							Name:  "Active",
							Value: "active",
						},
						{
							Name:  "Inactive",
							Value: "inactive",
						},
						{
							Name:  "Disabled",
							Value: "disabled",
						},
					},
				},
			},
		},
		{
			Name:        "testall",
			Description: "Test all channels",
		},
		{
			Name:        "monitor",
			Description: "Start monitoring channel status changes",
		},
		{
			Name:        "stats",
			Description: "Show channel statistics",
		},
	}

	// Register the commands
	Session.AddHandler(func(s *discordgo.Session, i *discordgo.InteractionCreate) {
		if !IsAdmin(i.Member.User.ID) {
			respondWithEmbed(s, i.Interaction, "Error", "You don't have permission to use this bot.", 0xFF0000)
			return
		}

		switch i.ApplicationCommandData().Name {
		case "channels":
			handleChannelsCommand(s, i)
		case "testall":
			handleTestAllCommand(s, i)
		case "monitor":
			handleMonitorCommand(s, i)
		case "stats":
			handleStatsCommand(s, i)
		}
	})

	// Register the commands with Discord after the connection is established
	Session.AddHandler(func(s *discordgo.Session, r *discordgo.Ready) {
		common.SysLog(fmt.Sprintf("Bot is now running as %s#%s", s.State.User.Username, s.State.User.Discriminator))
		// Set bot status
		s.UpdateGameStatus(0, "Monitoring API Channels")

		// Register commands for the specified guild
		guildID := os.Getenv("DISCORD_GUILD_ID")
		if guildID == "" {
			common.SysError("DISCORD_GUILD_ID not set")
			return
		}
		for _, command := range commands {
			_, err := s.ApplicationCommandCreate(s.State.User.ID, guildID, command)
			if err != nil {
				common.SysError(fmt.Sprintf("Error creating command %s in guild %s: %v", command.Name, guildID, err))
			} else {
				common.SysLog(fmt.Sprintf("Registered command %s in guild %s", command.Name, guildID))
			}
		}
	})

	// Set intents
	Session.Identify.Intents = discordgo.IntentsGuildMessages

	// Start monitoring routine
	go monitorChannels()

	err = Session.Open()
	if err != nil {
		return fmt.Errorf("error opening connection: %v", err)
	}

	return nil
}

func handleChannelsCommand(s *discordgo.Session, i *discordgo.InteractionCreate) {
	status := "all"
	if len(i.ApplicationCommandData().Options) > 0 {
		status = i.ApplicationCommandData().Options[0].StringValue()
	}

	channels, err := model.GetAllChannels(0, 0, true, false)
	if err != nil {
		respondWithEmbed(s, i.Interaction, "Error", fmt.Sprintf("Error getting channels: %v", err), 0xFF0000)
		return
	}

	var activeChannels, inactiveChannels, disabledChannels strings.Builder
	for _, ch := range channels {
		channelInfo := fmt.Sprintf("ID: %d | Name: %s | Models: %s\n", ch.Id, ch.Name, ch.Models)
		switch ch.Status {
		case common.ChannelStatusEnabled:
			activeChannels.WriteString(channelInfo)
		case common.ChannelStatusManuallyDisabled, common.ChannelStatusAutoDisabled:
			disabledChannels.WriteString(channelInfo)
		default:
			inactiveChannels.WriteString(channelInfo)
		}
	}

	embed := &discordgo.MessageEmbed{
		Title: "Channel Status Report",
		Color: 0x00FF00,
		Fields: []*discordgo.MessageEmbedField{},
		Timestamp: time.Now().Format(time.RFC3339),
	}

	if status == "all" || status == "active" {
		if activeChannels.Len() > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  "🟢 Active Channels",
				Value: "```\n" + activeChannels.String() + "```",
			})
		}
	}
	if status == "all" || status == "inactive" {
		if inactiveChannels.Len() > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  "🟡 Inactive Channels",
				Value: "```\n" + inactiveChannels.String() + "```",
			})
		}
	}
	if status == "all" || status == "disabled" {
		if disabledChannels.Len() > 0 {
			embed.Fields = append(embed.Fields, &discordgo.MessageEmbedField{
				Name:  "🔴 Disabled Channels",
				Value: "```\n" + disabledChannels.String() + "```",
			})
		}
	}

	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{embed},
		},
	})
}

func handleTestAllCommand(s *discordgo.Session, i *discordgo.InteractionCreate) {
	// Acknowledge the command immediately
	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Content: "Testing all channels... This may take a while.",
		},
	})

	err := controller.TestAllChannelsWithNotify(true)
	if err != nil {
		followUpEmbed(s, i.Interaction, "Error", fmt.Sprintf("Error testing channels: %v", err), 0xFF0000)
		return
	}

	followUpEmbed(s, i.Interaction, "Success", "Channel testing has been initiated. You will be notified of the results.", 0x00FF00)
}

func handleMonitorCommand(s *discordgo.Session, i *discordgo.InteractionCreate) {
	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{
				{
					Title:       "Channel Monitoring",
					Description: "Channel monitoring is active. You will be notified of any status changes.",
					Color:       0x00FF00,
					Footer: &discordgo.MessageEmbedFooter{
						Text: "Use /channels to see current status",
					},
				},
			},
		},
	})
}

func handleStatsCommand(s *discordgo.Session, i *discordgo.InteractionCreate) {
	channels, err := model.GetAllChannels(0, 0, true, false)
	if err != nil {
		respondWithEmbed(s, i.Interaction, "Error", fmt.Sprintf("Error getting channels: %v", err), 0xFF0000)
		return
	}

	var totalChannels, activeChannels, disabledChannels int
	modelStats := make(map[string]int)

	for _, ch := range channels {
		totalChannels++
		if ch.Status == common.ChannelStatusEnabled {
			activeChannels++
		} else if ch.Status == common.ChannelStatusManuallyDisabled || ch.Status == common.ChannelStatusAutoDisabled {
			disabledChannels++
		}

		models := strings.Split(ch.Models, ",")
		for _, model := range models {
			modelStats[strings.TrimSpace(model)]++
		}
	}

	var modelList strings.Builder
	for model, count := range modelStats {
		modelList.WriteString(fmt.Sprintf("%s: %d channels\n", model, count))
	}

	embed := &discordgo.MessageEmbed{
		Title: "Channel Statistics",
		Color: 0x00FF00,
		Fields: []*discordgo.MessageEmbedField{
			{
				Name:   "Total Channels",
				Value:  fmt.Sprintf("%d", totalChannels),
				Inline: true,
			},
			{
				Name:   "Active Channels",
				Value:  fmt.Sprintf("%d", activeChannels),
				Inline: true,
			},
			{
				Name:   "Disabled Channels",
				Value:  fmt.Sprintf("%d", disabledChannels),
				Inline: true,
			},
			{
				Name:  "Model Distribution",
				Value: "```\n" + modelList.String() + "```",
			},
		},
		Timestamp: time.Now().Format(time.RFC3339),
	}

	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{embed},
		},
	})
}

func monitorChannels() {
	var lastStatus = make(map[int]int)
	for {
		channels, err := model.GetAllChannels(0, 0, true, false)
		if err != nil {
			common.SysError("Error monitoring channels: " + err.Error())
			time.Sleep(30 * time.Second)
			continue
		}

		for _, ch := range channels {
			if lastStatus[ch.Id] != 0 && lastStatus[ch.Id] != ch.Status {
				// Status changed, notify in all guilds
				for _, guild := range Session.State.Guilds {
					embed := &discordgo.MessageEmbed{
						Title: "Channel Status Change",
						Color: getStatusColor(ch.Status),
						Fields: []*discordgo.MessageEmbedField{
							{
								Name:  "Channel",
								Value: fmt.Sprintf("%s (ID: %d)", ch.Name, ch.Id),
							},
							{
								Name:  "Status",
								Value: fmt.Sprintf("%s → %s", getStatusEmoji(lastStatus[ch.Id]), getStatusEmoji(ch.Status)),
							},
						},
						Timestamp: time.Now().Format(time.RFC3339),
					}

					// Find the first text channel in the guild
					for _, channel := range guild.Channels {
						if channel.Type == discordgo.ChannelTypeGuildText {
							Session.ChannelMessageSendEmbed(channel.ID, embed)
							break
						}
					}
				}
			}
			lastStatus[ch.Id] = ch.Status
		}

		time.Sleep(30 * time.Second)
	}
}

func getStatusColor(status int) int {
	switch status {
	case common.ChannelStatusEnabled:
		return 0x00FF00 // Green
	case common.ChannelStatusManuallyDisabled, common.ChannelStatusAutoDisabled:
		return 0xFF0000 // Red
	default:
		return 0xFFFF00 // Yellow
	}
}

func getStatusEmoji(status int) string {
	switch status {
	case common.ChannelStatusEnabled:
		return "🟢 Active"
	case common.ChannelStatusManuallyDisabled:
		return "🔴 Manually Disabled"
	case common.ChannelStatusAutoDisabled:
		return "🔴 Auto Disabled"
	default:
		return "🟡 Inactive"
	}
}

func respondWithEmbed(s *discordgo.Session, i *discordgo.Interaction, title, description string, color int) {
	s.InteractionRespond(i, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{
				{
					Title:       title,
					Description: description,
					Color:      color,
					Timestamp:  time.Now().Format(time.RFC3339),
				},
			},
		},
	})
}

func followUpEmbed(s *discordgo.Session, i *discordgo.Interaction, title, description string, color int) {
	s.FollowupMessageCreate(i, true, &discordgo.WebhookParams{
		Embeds: []*discordgo.MessageEmbed{
			{
				Title:       title,
				Description: description,
				Color:      color,
				Timestamp:  time.Now().Format(time.RFC3339),
			},
		},
	})
}

func Close() {
	if Session != nil {
		Session.Close()
	}
}