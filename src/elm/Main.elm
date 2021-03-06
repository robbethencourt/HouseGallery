port module Main exposing (..)

import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Navigation
import Home
import Signup
import Gallery
import Login
import AddArtwork
import Artwork
import Json.Decode as JD exposing (..)
import Json.Decode.Pipeline as JDP
import Json.Encode as JE


-- model


type alias Model =
    { page : Page
    , home : Home.Model
    , signup : Signup.Model
    , gallery : Gallery.Model
    , login : Login.Model
    , addArtwork : AddArtwork.Model
    , artwork : Artwork.Model
    , fbLoggedIn : Maybe String
    , uid : Maybe String
    , loggedIn : Bool
    , searchDisplay : Bool
    , search : String
    , searchContent : UserLink
    , searchError : Maybe String
    }


type alias UserLink =
    { displayName : String
    , userId : String
    }


type Page
    = NotFound
    | HomePage
    | SignupPage
    | GalleryPage
    | LoginPage
    | AddArtworkPage
    | ArtworkPage


init : Flags -> Navigation.Location -> ( Model, Cmd Msg )
init flags location =
    let
        page =
            hashToPage location.hash

        loggedIn =
            flags.fbLoggedIn /= Nothing

        ( updatedPage, cmd ) =
            authedRedirect page loggedIn

        ( homeInitModel, homeCmd ) =
            Home.init

        ( signupInitModel, signupCmd ) =
            Signup.init

        ( galleryInitModel, galleryCmd ) =
            Gallery.init

        ( loginInitModel, loginCmd ) =
            Login.init

        ( addArtworkInitModel, addArtworkCmd ) =
            AddArtwork.init

        ( artworkInitModel, artworkCmd ) =
            Artwork.init

        initSearchContent =
            { displayName = ""
            , userId = ""
            }

        initModel =
            { page = updatedPage
            , home = homeInitModel
            , signup = signupInitModel
            , gallery = galleryInitModel
            , login = loginInitModel
            , addArtwork = addArtworkInitModel
            , artwork = artworkInitModel
            , fbLoggedIn = flags.fbLoggedIn
            , uid = Nothing
            , loggedIn = loggedIn
            , searchDisplay = False
            , search = ""
            , searchContent = initSearchContent
            , searchError = Nothing
            }

        cmds =
            Cmd.batch
                [ Cmd.map HomeMsg homeCmd
                , Cmd.map SignupMsg signupCmd
                , Cmd.map GalleryMsg galleryCmd
                , Cmd.map LoginMsg loginCmd
                , Cmd.map AddArtworkMsg addArtworkCmd
                , Cmd.map ArtworkMsg artworkCmd
                , cmd
                ]
    in
        ( initModel, cmds )



-- update


type Msg
    = Navigate Page
    | ChangePage Page
    | HomeMsg Home.Msg
    | SignupMsg Signup.Msg
    | GalleryMsg Gallery.Msg
    | LoginMsg Login.Msg
    | AddArtworkMsg AddArtwork.Msg
    | ArtworkMsg Artwork.Msg
    | Logout
    | SearchDisplay
    | SearchHide
    | SearchInput String
    | NoUserFetched String
    | UserFetched String
    | FetchSearchUserGallery
    | FetchLoggedInUserGallery


authPages : List Page
authPages =
    [ AddArtworkPage
    , ArtworkPage
    ]


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Navigate page ->
            ( { model | page = page }, Navigation.newUrl <| pageToHash page )

        ChangePage page ->
            let
                ( updatedPage, cmd ) =
                    authedRedirect page model.loggedIn
            in
                ( { model | page = updatedPage }, cmd )

        HomeMsg msg ->
            let
                ( homeModel, cmd ) =
                    Home.update msg model.home
            in
                ( { model | home = homeModel }
                , Cmd.map HomeMsg cmd
                )

        SignupMsg msg ->
            let
                ( signupModel, cmd, fbData ) =
                    Signup.update msg model.signup

                loggedIn =
                    fbData /= Nothing

                uidDecoded =
                    case fbData of
                        Just jStringify ->
                            case (decoder jStringify "uid") of
                                Ok stringWithoutOK ->
                                    Just stringWithoutOK

                                Err error ->
                                    Just "uid error"

                        Nothing ->
                            Just "no uid"

                fbLoggedInDecoded =
                    case fbData of
                        Just jStringifyFbLoggedIn ->
                            case (decoder jStringifyFbLoggedIn "fbLoggedIn") of
                                Ok stringFbLoggedInWithoutOK ->
                                    Just stringFbLoggedInWithoutOK

                                Err error ->
                                    Just "fbLoggedIn error"

                        Nothing ->
                            Just "no fbLoggedIn"
            in
                ( { model
                    | signup = signupModel
                    , fbLoggedIn = fbLoggedInDecoded
                    , uid = uidDecoded
                    , loggedIn = loggedIn
                  }
                , Cmd.batch
                    [ Cmd.map SignupMsg cmd ]
                )

        GalleryMsg msg ->
            let
                ( galleryModel, cmd ) =
                    Gallery.update msg model.gallery
            in
                ( { model | gallery = galleryModel }
                , Cmd.map GalleryMsg cmd
                )

        LoginMsg msg ->
            let
                ( loginModel, cmd, fbData ) =
                    Login.update msg model.login

                loggedIn =
                    fbData /= Nothing

                uidDecoded =
                    case fbData of
                        Just jStringify ->
                            case (decoder jStringify "uid") of
                                Ok stringWithoutOK ->
                                    Just stringWithoutOK

                                Err error ->
                                    Just "uid error"

                        Nothing ->
                            Just "no uid"

                fbLoggedInDecoded =
                    case fbData of
                        Just jStringifyFbLoggedIn ->
                            case (decoder jStringifyFbLoggedIn "fbLoggedIn") of
                                Ok stringFbLoggedInWithoutOK ->
                                    Just stringFbLoggedInWithoutOK

                                Err error ->
                                    Just "fbLoggedIn error"

                        Nothing ->
                            Just "no fbLoggedIn"
            in
                ( { model
                    | login = loginModel
                    , fbLoggedIn = fbLoggedInDecoded
                    , uid = uidDecoded
                    , loggedIn = loggedIn
                  }
                , Cmd.batch
                    [ Cmd.map LoginMsg cmd ]
                )

        AddArtworkMsg msg ->
            let
                ( addArtworkModel, cmd ) =
                    AddArtwork.update
                        (Maybe.withDefault "" model.uid)
                        msg
                        model.addArtwork
            in
                ( { model | addArtwork = addArtworkModel }
                , Cmd.map AddArtworkMsg cmd
                )

        ArtworkMsg msg ->
            let
                ( artworkModel, cmd ) =
                    Artwork.update
                        (Maybe.withDefault "" model.uid)
                        msg
                        model.artwork
            in
                ( { model | artwork = artworkModel }
                , Cmd.map ArtworkMsg cmd
                )

        Logout ->
            ( { model
                | fbLoggedIn = Nothing
                , uid = Nothing
                , loggedIn = False
              }
            , Cmd.batch
                [ logout ()
                , Navigation.newUrl "#/login"
                ]
            )

        SearchDisplay ->
            ( { model | searchDisplay = True }, Cmd.none )

        SearchHide ->
            ( { model | searchDisplay = False }, Cmd.none )

        SearchInput search ->
            ( { model | search = search }, fetchingUsers search )

        NoUserFetched noJsonUser ->
            decodeJson noJsonUser model

        UserFetched jsonUser ->
            decodeJson jsonUser model

        FetchSearchUserGallery ->
            let
                body =
                    JE.object
                        [ ( "userId", JE.string (fromJust model.uid) )
                        , ( "searchId", JE.string model.searchContent.userId )
                        ]
                        |> JE.encode 4
            in
                ( model, fetchingSearchUserGallery body )

        FetchLoggedInUserGallery ->
            let
                body =
                    JE.object
                        [ ( "userId", JE.string (fromJust model.uid) )
                        , ( "searchId", JE.string (fromJust model.uid) )
                        ]
                        |> JE.encode 4
            in
                ( { model | searchDisplay = False }, fetchingSearchUserGallery body )


fromJust : Maybe String -> String
fromJust just =
    case just of
        Nothing ->
            "there was nothing in that maybe"

        Just val ->
            val


authForPage : Page -> Bool -> Bool
authForPage page loggedIn =
    loggedIn || not (List.member page authPages)


authedRedirect : Page -> Bool -> ( Page, Cmd Msg )
authedRedirect page loggedIn =
    if authForPage page loggedIn then
        ( page, Cmd.none )
    else
        ( LoginPage, Navigation.modifyUrl <| pageToHash LoginPage )


decodeJson : String -> Model -> ( Model, Cmd Msg )
decodeJson stringifiedUser model =
    case JD.decodeString decodeUser stringifiedUser of
        Ok user ->
            ( { model
                | searchContent = { user | displayName = user.displayName }
                , searchContent = { user | userId = user.userId }
              }
            , Cmd.none
            )

        Err err ->
            ( { model | searchError = Just err }, Cmd.none )


decodeUser : JD.Decoder UserLink
decodeUser =
    JDP.decode UserLink
        |> JDP.required "displayName" JD.string
        |> JDP.required "userId" JD.string



-- view


view : Model -> Html Msg
view model =
    let
        page =
            case model.page of
                HomePage ->
                    Html.map HomeMsg
                        (Home.view model.home)

                SignupPage ->
                    Html.map SignupMsg
                        (Signup.view model.signup)

                GalleryPage ->
                    Html.map GalleryMsg
                        (Gallery.view model.gallery)

                LoginPage ->
                    Html.map LoginMsg
                        (Login.view model.login)

                AddArtworkPage ->
                    Html.map AddArtworkMsg
                        (AddArtwork.view model.addArtwork)

                ArtworkPage ->
                    Html.map ArtworkMsg
                        (Artwork.view model.artwork)

                NotFound ->
                    div [ class "main" ]
                        [ h1 []
                            [ text "Page Not Found!" ]
                        ]
    in
        if model.searchDisplay then
            div []
                [ pageHeader model
                , searchResults model
                , page
                ]
        else
            div []
                [ pageHeader model
                , page
                ]


pageHeader : Model -> Html Msg
pageHeader model =
    if model.loggedIn then
        header [ class "container-fluid" ]
            [ nav [ class "navbar" ]
                [ ul [ class "nav navbar-nav navbar-left" ]
                    [ li []
                        [ a
                            [ class "a-img", onClick (Navigate HomePage) ]
                            [ img [ class "nav__img", src "dist/img/houseable-logo.svg" ] [] ]
                        ]
                    , li []
                        [ a [ onClick (Navigate GalleryPage) ] [ text "Gallery" ] ]
                    , li []
                        [ a [ onClick (Navigate AddArtworkPage) ] [ text "Add Artwork" ] ]
                    ]
                , ul [ class "nav navbar-nav navbar-right" ]
                    [ li []
                        [ a [ onClick Logout ] [ text "Logout" ] ]
                    , li []
                        [ span [ onClick SearchDisplay, class "glyphicon glyphicon-search navbar__search-icon" ] []
                        ]
                    ]
                ]
              -- , p [] [ text (toString model) ]
            ]
    else
        header [ class "container-fluid" ]
            [ nav [ class "navbar" ]
                [ ul [ class "nav navbar-nav navbar-left" ]
                    [ li []
                        [ a
                            [ class "a-img", onClick (Navigate HomePage) ]
                            [ img [ class "nav__img", src "dist/img/houseable-logo.svg" ] [] ]
                        ]
                    ]
                , ul [ class "nav navbar-nav navbar-right" ]
                    [ li []
                        [ a [ onClick (Navigate LoginPage) ] [ text "Login" ] ]
                    , li []
                        [ a [ onClick (Navigate SignupPage) ] [ text "Signup" ] ]
                    , li []
                        [ span [ onClick SearchDisplay, class "glyphicon glyphicon-search navbar__search-icon" ] []
                        ]
                    ]
                ]
              -- , p [] [ text (toString model) ]
            ]


searchResults : Model -> Html Msg
searchResults model =
    div [ class "search-results" ]
        [ if model.loggedIn then
            div [ class "search-results__search-header" ]
                [ p [ class "search-results__search-header__close-search", onClick FetchLoggedInUserGallery ] [ text "Return to my Gallery" ]
                ]
          else
            div [ class "search-results__search-header" ]
                [ p [ class "search-results__search-header__close-search", onClick SearchHide ] [ text "Close" ]
                ]
        , input
            [ type_ "text"
            , class "formRow__input formRow__input--search"
            , placeholder "search for users"
            , onFocus SearchDisplay
            , Html.Attributes.value model.search
            , onInput SearchInput
            ]
            []
        , if model.searchContent.userId == "" then
            p [ class "search-results__search-header__search-content" ] [ text model.searchContent.displayName ]
          else
            p [ class "search-results__search-header__search-content", onClick FetchSearchUserGallery ] [ a [ class "search-results__search-header__search-content__a", href "#/gallery" ] [ text model.searchContent.displayName ] ]
        ]



-- subscriptions


subscriptions : Model -> Sub Msg
subscriptions model =
    let
        homeSub =
            Home.subscriptions model.home

        signupSub =
            Signup.subscriptions model.signup

        gallerySub =
            Gallery.subscriptions model.gallery

        loginSub =
            Login.subscriptions model.login

        addArtworkSub =
            AddArtwork.subscriptions model.addArtwork

        artworkSub =
            Artwork.subscriptions model.artwork
    in
        Sub.batch
            [ Sub.map HomeMsg homeSub
            , Sub.map SignupMsg signupSub
            , Sub.map GalleryMsg gallerySub
            , Sub.map LoginMsg loginSub
            , Sub.map AddArtworkMsg addArtworkSub
            , Sub.map ArtworkMsg artworkSub
            , noUserFetched NoUserFetched
            , userFetched UserFetched
            ]


hashToPage : String -> Page
hashToPage hash =
    case hash of
        "#/" ->
            HomePage

        "" ->
            HomePage

        "#/signup" ->
            SignupPage

        "#/gallery" ->
            GalleryPage

        "#/login" ->
            LoginPage

        "#/addArtwork" ->
            AddArtworkPage

        "#/artwork" ->
            ArtworkPage

        _ ->
            NotFound


pageToHash : Page -> String
pageToHash page =
    case page of
        HomePage ->
            "#/"

        SignupPage ->
            "#/signup"

        GalleryPage ->
            "#/gallery"

        LoginPage ->
            "#/login"

        AddArtworkPage ->
            "#/addArtwork"

        ArtworkPage ->
            "#/artwork"

        NotFound ->
            "#notFound"


decoder : String -> String -> Result String String
decoder jsonToDecode jsonKey =
    JD.decodeString (field jsonKey string) jsonToDecode



-- main


locationToMsg : Navigation.Location -> Msg
locationToMsg location =
    location.hash
        |> hashToPage
        |> ChangePage


type alias Flags =
    { fbLoggedIn : Maybe String }


main : Program Flags Model Msg
main =
    Navigation.programWithFlags locationToMsg
        { init = init
        , update = update
        , view = view
        , subscriptions = subscriptions
        }


port logout : () -> Cmd msg


port fetchingUsers : String -> Cmd msg


port noUserFetched : (String -> msg) -> Sub msg


port userFetched : (String -> msg) -> Sub msg


port fetchingSearchUserGallery : String -> Cmd msg
