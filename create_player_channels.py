import discord
import os
from dotenv import load_dotenv

load_dotenv()
token = os.getenv('DISCORD_TOKEN')

intents = discord.Intents.default()
intents.message_content = True

client = discord.Client(intents=intents)

@client.event
async def on_ready():
    print(f'We have logged in as {client.user}')

@client.event
async def on_message(message):
    if message.author == client.user:
        return

    if message.content.startswith('add '):
        alliance_name = message.content[4:]
        await add_alliance_channels(message, alliance_name)
    elif message.content.startswith('reset server'):
        await reset_server(message)

async def add_alliance_channels(message, alliance_name):
    guild = message.guild
    category = discord.utils.get(guild.categories, name=alliance_name.upper())
    if category == None:
        category = await guild.create_category(alliance_name.upper())
        print(f'Created {alliance_name} category')

    with open(f'server_rosters/{alliance_name}.txt', 'r') as roster:
        sword_roster = roster.read().splitlines()
        sword_roster = [item.lower() for item in sword_roster]
        sword_roster.sort()
        for line in sword_roster:
            if line[0:1].isalpha():
                try: 
                    channel = discord.utils.get(guild.channels, name=line)
                    if channel == None:
                        await guild.create_text_channel(line, category=category)
                        print(f'Created {line} channel')
                    else:
                        print(f'{line} channel already exists')
                except:
                    print(f'Error creating {line} channel')
                    category = await guild.create_category(f'{alliance_name}2'.upper())
                    await guild.create_text_channel(line, category=category)
    
    print(f'Finished creating {alliance_name} channels')

async def reset_server(message):
    VALID_CHANNELS = ['mute-me-discord-junk', 'chat', 'prod-bot', 'dev-bot', 'general']
    guild = message.guild
    # Get all channels from the discord server and delete any that aren't in the VALID_CHANNELS list
    for channel in guild.channels:
        if channel.name not in VALID_CHANNELS:
            await channel.delete()

client.run(token)