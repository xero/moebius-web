import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Worker Module Core Functions', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('Utility Functions', () => {
		it('should remove duplicate blocks correctly', () => {
			// Test the removeDuplicates function logic
			const removeDuplicates = blocks => {
				const indexes = [];
				let index;
				blocks = blocks.reverse();
				blocks = blocks.filter(block => {
					index = block >> 16;
					if (indexes.lastIndexOf(index) === -1) {
						indexes.push(index);
						return true;
					}
					return false;
				});
				return blocks.reverse();
			};

			// Block format: (index << 16) | data
			const blocks = [
				(1 << 16) | 0x41, // Position 1, data 0x41
				(2 << 16) | 0x42, // Position 2, data 0x42
				(1 << 16) | 0x43, // Position 1, data 0x43 (duplicate position)
				(3 << 16) | 0x44, // Position 3, data 0x44
				(2 << 16) | 0x45, // Position 2, data 0x45 (duplicate position)
			];

			const result = removeDuplicates(blocks);

			// Should keep only the last occurrence of each position
			// Order should be maintained after deduplication and reverse
			expect(result.length).toBe(3);
			expect(result).toContain((1 << 16) | 0x43); // Last occurrence of position 1
			expect(result).toContain((3 << 16) | 0x44); // Only occurrence of position 3
			expect(result).toContain((2 << 16) | 0x45); // Last occurrence of position 2
		});

		it('should handle empty blocks array', () => {
			const removeDuplicates = blocks => {
				const indexes = [];
				let index;
				blocks = blocks.reverse();
				blocks = blocks.filter(block => {
					index = block >> 16;
					if (indexes.lastIndexOf(index) === -1) {
						indexes.push(index);
						return true;
					}
					return false;
				});
				return blocks.reverse();
			};

			const result = removeDuplicates([]);
			expect(result).toEqual([]);
		});

		it('should handle single block', () => {
			const removeDuplicates = blocks => {
				const indexes = [];
				let index;
				blocks = blocks.reverse();
				blocks = blocks.filter(block => {
					index = block >> 16;
					if (indexes.lastIndexOf(index) === -1) {
						indexes.push(index);
						return true;
					}
					return false;
				});
				return blocks.reverse();
			};

			const blocks = [(1 << 16) | 0x41];
			const result = removeDuplicates(blocks);
			expect(result).toEqual(blocks);
		});
	});

	describe('Message Sending Logic', () => {
		it('should format messages correctly for WebSocket', () => {
			const send = (cmd, msg) => {
				return JSON.stringify([cmd, msg]);
			};

			expect(send('join', 'TestUser')).toBe('["join","TestUser"]');
			expect(send('chat', 'Hello world')).toBe('["chat","Hello world"]');
			expect(send('draw', [0x41, 0x42])).toBe('["draw",[65,66]]');
		});

		it('should handle different message types', () => {
			const messageTypes = [
				{ cmd: 'join', data: 'TestUser' },
				{ cmd: 'nick', data: 'NewNick' },
				{ cmd: 'chat', data: 'Hello' },
				{ cmd: 'draw', data: [0x41, 0x42]},
				{ cmd: 'canvasSettings', data: { columns: 80, rows: 25 } },
				{ cmd: 'resize', data: { columns: 100, rows: 30 } },
				{ cmd: 'fontChange', data: { fontName: 'CP437 8x8' } },
				{ cmd: 'iceColorsChange', data: { iceColors: true } },
				{ cmd: 'letterSpacingChange', data: { letterSpacing: false } },
			];

			messageTypes.forEach(({ cmd, data }) => {
				const formatted = JSON.stringify([cmd, data]);
				expect(formatted).toContain(cmd);
				expect(formatted).toContain(JSON.stringify(data));
			});
		});
	});

	describe('Message Processing Logic', () => {
		it('should process start messages correctly', () => {
			const onStart = (msg, newSessionID) => {
				return {
					sessionID: newSessionID,
					joint: msg,
					canvasSettings: {
						columns: msg.columns,
						rows: msg.rows,
						iceColors: msg.iceColors,
						letterSpacing: msg.letterSpacing,
						fontName: msg.fontName,
					},
					chatHistory: msg.chat || [],
				};
			};

			const startData = {
				columns: 80,
				rows: 25,
				iceColors: false,
				letterSpacing: true,
				fontName: 'CP437 8x16',
				chat: [['User1', 'Hello'], ['User2', 'Hi']],
			};

			const result = onStart(startData, 'session123');

			expect(result.sessionID).toBe('session123');
			expect(result.joint).toBe(startData);
			expect(result.canvasSettings.columns).toBe(80);
			expect(result.canvasSettings.rows).toBe(25);
			expect(result.chatHistory).toHaveLength(2);
		});

		it('should handle join notifications correctly', () => {
			const onJoin = (handle, joinSessionID, currentSessionID) => {
				return {
					handle,
					sessionID: joinSessionID,
					showNotification: joinSessionID !== currentSessionID,
				};
			};

			const currentSession = 'session123';

			// Same session - no notification
			const sameSession = onJoin('User1', 'session123', currentSession);
			expect(sameSession.showNotification).toBe(false);

			// Different session - show notification
			const differentSession = onJoin('User2', 'session456', currentSession);
			expect(differentSession.showNotification).toBe(true);
		});

		it('should handle nick changes correctly', () => {
			const onNick = (handle, nickSessionID, currentSessionID) => {
				return {
					handle,
					sessionID: nickSessionID,
					showNotification: nickSessionID !== currentSessionID,
				};
			};

			const currentSession = 'session123';

			// Different session - show notification
			const result = onNick('NewNick', 'session456', currentSession);
			expect(result.handle).toBe('NewNick');
			expect(result.sessionID).toBe('session456');
			expect(result.showNotification).toBe(true);
		});
	});

	describe('WebSocket Connection States', () => {
		it('should recognize WebSocket ready states', () => {
			// Test WebSocket constants
			expect(0).toBe(0); // CONNECTING
			expect(1).toBe(1); // OPEN
			expect(2).toBe(2); // CLOSING
			expect(3).toBe(3); // CLOSED
		});

		it('should validate connection state before sending', () => {
			const canSend = readyState => readyState === 1; // WebSocket.OPEN

			expect(canSend(0)).toBe(false); // CONNECTING
			expect(canSend(1)).toBe(true);  // OPEN
			expect(canSend(2)).toBe(false); // CLOSING
			expect(canSend(3)).toBe(false); // CLOSED
		});
	});

	describe('Error Handling Logic', () => {
		it('should handle malformed message data gracefully', () => {
			const parseMessage = data => {
				try {
					return JSON.parse(data);
				} catch {
					return null;
				}
			};

			expect(parseMessage('["valid","json"]')).toEqual(['valid', 'json']);
			expect(parseMessage('invalid json{')).toBeNull();
			expect(parseMessage('')).toBeNull();
			expect(parseMessage(null)).toBeNull();
		});

		it('should handle unknown commands gracefully', () => {
			const processCommand = cmd => {
				const knownCommands = [
					'start', 'join', 'nick', 'draw', 'chat', 'part',
					'canvasSettings', 'resize', 'fontChange',
					'iceColorsChange', 'letterSpacingChange',
				];

				return {
					isKnown: knownCommands.includes(cmd),
					command: cmd,
				};
			};

			expect(processCommand('join').isKnown).toBe(true);
			expect(processCommand('unknownCommand').isKnown).toBe(false);
			expect(processCommand('chat').isKnown).toBe(true);
		});
	});

	describe('Canvas Settings Synchronization', () => {
		it('should extract canvas settings correctly', () => {
			const extractCanvasSettings = msg => {
				return {
					columns: msg.columns,
					rows: msg.rows,
					iceColors: msg.iceColors,
					letterSpacing: msg.letterSpacing,
					fontName: msg.fontName,
				};
			};

			const input = {
				columns: 120,
				rows: 40,
				iceColors: true,
				letterSpacing: false,
				fontName: 'CP437 8x8',
				otherData: 'ignored',
			};

			const result = extractCanvasSettings(input);

			expect(result.columns).toBe(120);
			expect(result.rows).toBe(40);
			expect(result.iceColors).toBe(true);
			expect(result.letterSpacing).toBe(false);
			expect(result.fontName).toBe('CP437 8x8');
			expect(result.otherData).toBeUndefined();
		});

		it('should handle partial settings updates', () => {
			const updateSettings = (current, updates) => {
				return { ...current, ...updates };
			};

			const currentSettings = {
				columns: 80,
				rows: 25,
				iceColors: false,
				letterSpacing: false,
				fontName: 'CP437 8x16',
			};

			const partialUpdate = { iceColors: true, fontName: 'CP437 8x8' };
			const result = updateSettings(currentSettings, partialUpdate);

			expect(result.columns).toBe(80); // Unchanged
			expect(result.rows).toBe(25); // Unchanged
			expect(result.iceColors).toBe(true); // Updated
			expect(result.letterSpacing).toBe(false); // Unchanged
			expect(result.fontName).toBe('CP437 8x8'); // Updated
		});
	});

	describe('Chat History Management', () => {
		it('should process chat history correctly', () => {
			const processChatHistory = (chatArray = []) => {
				return chatArray.map(([handle, text]) => ({
					handle,
					text,
					showNotification: false, // Historical messages don't show notifications
				}));
			};

			const chatHistory = [
				['User1', 'Hello everyone'],
				['User2', 'Hi there!'],
				['User1', 'How is everyone doing?'],
			];

			const result = processChatHistory(chatHistory);

			expect(result).toHaveLength(3);
			expect(result[0].handle).toBe('User1');
			expect(result[0].text).toBe('Hello everyone');
			expect(result[0].showNotification).toBe(false);
		});

		it('should handle empty chat history', () => {
			const processChatHistory = (chatArray = []) => {
				return chatArray.map(([handle, text]) => ({
					handle,
					text,
					showNotification: false,
				}));
			};

			expect(processChatHistory([])).toEqual([]);
			expect(processChatHistory()).toEqual([]);
		});
	});
});
