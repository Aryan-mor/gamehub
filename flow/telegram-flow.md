flowchart TD
    %% Entry Points
    Start([User Enters Bot]) --> Entry{Entry Method}
    Entry -->|/start| Welcome[Welcome Message<br/>Main Menu]
    Entry -->|Direct Link<br/>room_xxx| DirectJoin[Direct Room Join]
    Entry -->|Callback Query| CallbackHandler[Callback Handler]
    
    %% Welcome Flow
    Welcome --> MainMenu{Main Menu Options}
    MainMenu -->|🃏 Start Poker| PokerStart[Poker Game Hub]
    MainMenu -->|🃏 Start Games| GamesStart[Games Selection]
    MainMenu -->|🪙 Free Coin| FreeCoin[Free Coin Claim]
    MainMenu -->|💰 Balance| Balance[Check Balance]
    MainMenu -->|❓ Help| Help[Help Information]
    
    %% Poker Start Flow
    PokerStart --> PokerMenu{Poker Menu Options}
    PokerMenu -->|🏠 ساخت روم| CreateRoom[Room Creation Form]
    PokerMenu -->|🚪 ورود به روم| JoinRoom[Room Join Options]
    PokerMenu -->|📋 لیست روم‌ها| ListRooms[Available Rooms List]
    PokerMenu -->|🔙 بازگشت به منو| Welcome
    
    %% Room Creation Flow
    CreateRoom --> CheckActiveRoom{User in Active Room?}
    CheckActiveRoom -->|Yes| ActiveRoomError[Error: Already in Room]
    CheckActiveRoom -->|No| FormStep1[Form Step 1: Room Name]
    
    FormStep1 --> FormStep2[Form Step 2: Privacy]
    FormStep2 --> FormStep3[Form Step 3: Max Players]
    FormStep3 --> FormStep4[Form Step 4: Small Blind]
    FormStep4 --> FormStep5[Form Step 5: Timeout]
    FormStep5 --> FormConfirm[Form Confirmation]
    
    FormConfirm --> ValidateForm{Form Valid?}
    ValidateForm -->|No| FormError[Form Validation Error]
    ValidateForm -->|Yes| CreateRoomSuccess[Room Created Successfully]
    
    FormError --> EditForm[Edit Form]
    EditForm --> FormStep1
    
    %% Room Join Flow
    JoinRoom --> JoinMethod{Join Method}
    JoinMethod -->|Enter Room ID| ManualJoin[Manual Room Join]
    JoinMethod -->|From Room List| ListJoin[Join from List]
    JoinMethod -->|Direct Link| DirectJoin
    
    DirectJoin --> ValidateJoin{Join Validation}
    ManualJoin --> ValidateJoin
    ListJoin --> ValidateJoin
    
    ValidateJoin -->|Room Not Found| JoinError[Room Not Found Error]
    ValidateJoin -->|Room Full| RoomFullError[Room Full Error]
    ValidateJoin -->|User in Active Room| RedirectToActive[Redirect to Active Room]
    ValidateJoin -->|Valid Join| JoinSuccess[Successfully Joined Room]
    
    %% Room List Flow
    ListRooms --> CheckRooms{Available Rooms?}
    CheckRooms -->|No Rooms| NoRoomsMessage[No Available Rooms]
    CheckRooms -->|Has Rooms| RoomList[Display Room List]
    
    RoomList --> SelectRoom{Select Room}
    SelectRoom --> JoinFromList[Join Selected Room]
    JoinFromList --> ValidateJoin
    
    %% Room Management Flow
    JoinSuccess --> RoomManagement[Room Management View]
    CreateRoomSuccess --> RoomManagement
    
    RoomManagement --> RoomActions{Room Actions}
    RoomActions -->|✅ آماده| SetReady[Set Player Ready]
    RoomActions -->|❌ آماده نیستم| SetNotReady[Set Player Not Ready]
    RoomActions -->|🎮 شروع بازی| StartGame[Start Game]
    RoomActions -->|🚪 خروج از روم| LeaveRoom[Leave Room]
    RoomActions -->|📊 اطلاعات روم| RoomInfo[Room Information]
    RoomActions -->|👁️ تماشا| SpectateMode[Spectator Mode]
    RoomActions -->|🔙 بازگشت| PokerStart
    
    %% Game Start Flow
    StartGame --> StartValidation{Start Validation}
    StartValidation -->|Not Creator| CreatorError[Only Creator Can Start]
    StartValidation -->|Game Already Started| GameStartedError[Game Already Started]
    StartValidation -->|Insufficient Players| PlayerCountError[Need 2+ Players]
    StartValidation -->|Valid Start| GameStarted[Game Started Successfully]
    
    GameStarted --> DealCards[Deal Cards to Players]
    DealCards --> SendNotifications[Send Game Notifications]
    SendNotifications --> GameInProgress[Game In Progress]
    
    %% Game Play Flow
    GameInProgress --> CurrentPlayer{Current Player Turn?}
    CurrentPlayer -->|Yes| PlayerTurn[Player's Turn]
    CurrentPlayer -->|No| WaitForTurn[Wait for Other Player]
    
    PlayerTurn --> GameActions{Game Actions}
    GameActions -->|❌ تخلیه| FoldAction[Fold Hand]
    GameActions -->|👁️ بررسی| CheckAction[Check]
    GameActions -->|🃏 برابری| CallAction[Call Bet]
    GameActions -->|💰 افزایش| RaiseAction[Raise Bet]
    GameActions -->|🔥 همه چیز| AllInAction[All In]
    
    %% Raise Flow
    RaiseAction --> RaiseAmount{Select Raise Amount}
    RaiseAmount -->|+5| Raise5[Raise +5]
    RaiseAmount -->|+10| Raise10[Raise +10]
    RaiseAmount -->|+25| Raise25[Raise +25]
    RaiseAmount -->|+50| Raise50[Raise +50]
    RaiseAmount -->|+100| Raise100[Raise +100]
    
    %% Action Processing
    FoldAction --> ProcessAction[Process Action]
    CheckAction --> ProcessAction
    CallAction --> ProcessAction
    Raise5 --> ProcessAction
    Raise10 --> ProcessAction
    Raise25 --> ProcessAction
    Raise50 --> ProcessAction
    Raise100 --> ProcessAction
    AllInAction --> ProcessAction
    
    ProcessAction --> UpdateGameState[Update Game State]
    UpdateGameState --> CheckGameEnd{Game Ended?}
    
    CheckGameEnd -->|No| NextPlayer[Move to Next Player]
    CheckGameEnd -->|Yes| GameFinished[Game Finished]
    
    NextPlayer --> CurrentPlayer
    
    %% Game End Flow
    GameFinished --> ShowResults[Show Game Results]
    ShowResults --> GameEndActions{Game End Actions}
    GameEndActions -->|🔄 بازی دوباره| PlayAgain[Start New Game]
    GameEndActions -->|🆕 بازی جدید| NewGame[Create New Room]
    GameEndActions -->|📊 آمار| ViewStats[View Statistics]
    GameEndActions -->|🏁 پایان بازی| GameEnd[End Game]
    GameEndActions -->|📜 تاریخچه| GameHistory[Game History]
    GameEndActions -->|🔙 بازگشت به منو| Welcome
    
    %% Play Again Flow
    PlayAgain --> PlayAgainValidation{Can Start New Game?}
    PlayAgainValidation -->|Not Creator| CreatorError2[Only Creator Can Start]
    PlayAgainValidation -->|Valid| ResetRoom[Reset Room for New Game]
    ResetRoom --> GameStarted
    
    %% New Game Flow
    NewGame --> CreateNewRoom[Create New Room with Defaults]
    CreateNewRoom --> RoomManagement
    
    %% Spectator Mode
    SpectateMode --> SpectatorView[Spectator View]
    SpectatorView --> SpectatorActions{Spectator Actions}
    SpectatorActions -->|🔄 بروزرسانی| RefreshSpectator[Refresh View]
    SpectatorActions -->|🔙 بازگشت به منو| Welcome
    SpectatorActions -->|❓ راهنما| Help
    
    %% Leave Room Flow
    LeaveRoom --> LeaveValidation{Leave Validation}
    LeaveValidation -->|Creator| CreatorLeave[Creator Leaves]
    LeaveValidation -->|Player| PlayerLeave[Player Leaves]
    
    CreatorLeave --> CheckRemainingPlayers{Remaining Players?}
    CheckRemainingPlayers -->|No Players| DeleteRoom[Delete Room]
    CheckRemainingPlayers -->|Has Players| TransferOwnership[Transfer Ownership]
    
    PlayerLeave --> UpdateRemainingPlayers[Update Remaining Players]
    
    DeleteRoom --> Welcome
    TransferOwnership --> UpdateRemainingPlayers
    UpdateRemainingPlayers --> Welcome
    
    %% Error Handling
    ActiveRoomError --> Welcome
    JoinError --> Welcome
    RoomFullError --> Welcome
    CreatorError --> RoomManagement
    CreatorError2 --> GameEndActions
    GameStartedError --> RoomManagement
    PlayerCountError --> RoomManagement
    NoRoomsMessage --> PokerStart
    
    %% Wait States
    WaitForTurn --> RefreshGame[Refresh Game State]
    RefreshGame --> CurrentPlayer
    
    %% Navigation
    RedirectToActive --> RoomManagement
    RoomInfo --> RoomManagement
    ViewStats --> GameEndActions
    GameHistory --> GameEndActions
    GameEnd --> Welcome
    Help --> Welcome
    Balance --> Welcome
    FreeCoin --> Welcome
    GamesStart --> Welcome
    
    %% Styling
    classDef entryPoint fill:#e1f5fe
    classDef menu fill:#f3e5f5
    classDef action fill:#e8f5e8
    classDef error fill:#ffebee
    classDef gameState fill:#fff3e0
    classDef decision fill:#fce4ec
    
    class Start,Entry,Welcome entryPoint
    class MainMenu,PokerMenu,RoomActions,GameActions,GameEndActions,SpectatorActions menu
    class CreateRoom,JoinRoom,StartGame,FoldAction,CallAction,RaiseAction,AllInAction,CheckAction action
    class ActiveRoomError,JoinError,RoomFullError,CreatorError,GameStartedError,PlayerCountError error
    class GameInProgress,GameFinished,RoomManagement gameState
    class CheckActiveRoom,ValidateJoin,StartValidation,CurrentPlayer,CheckGameEnd,LeaveValidation decision