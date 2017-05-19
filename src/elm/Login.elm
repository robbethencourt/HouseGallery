port module Login exposing (..)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (..)
import Json.Encode as JE
import Navigation


-- model


type alias Model =
    { email : String
    , password : String
    , error : Maybe String
    }


initModel : Model
initModel =
    { email = ""
    , password = ""
    , error = Nothing
    }


init : ( Model, Cmd Msg )
init =
    ( initModel, Cmd.none )



-- update


type Msg
    = EmailInput String
    | PasswordInput String
    | Submit
    | Error String
    | UserLoggedIn String


update : Msg -> Model -> ( Model, Cmd Msg, Maybe String )
update msg model =
    case msg of
        EmailInput email ->
            ( { model | email = email }, Cmd.none, Nothing )

        PasswordInput password ->
            ( { model | password = password }, Cmd.none, Nothing )

        Submit ->
            let
                body =
                    JE.object
                        [ ( "email", JE.string model.email )
                        , ( "password", JE.string model.password )
                        ]
                        |> JE.encode 4

                cmd =
                    fetchingUser body
            in
                ( model, cmd, Nothing )

        Error error ->
            ( { model | error = Just error }, Cmd.none, Nothing )

        UserLoggedIn fbData ->
            ( { model
                | email = ""
                , password = ""
              }
            , Navigation.newUrl "#/gallery"
            , Just fbData
            )



-- view


view : Model -> Html Msg
view model =
    div [ class "main" ]
        [ errorPanel model.error
        , loginForm model
          -- , p [] [ text (toString model) ]
        ]


loginForm : Model -> Html Msg
loginForm model =
    div [ class "row formRow login-signup" ]
        [ div [ class "col-md-6 col-md-offset-3" ]
            [ Html.form [ class "formRow__form", onSubmit Submit ]
                [ input
                    [ type_ "email"
                    , class "formRow__input formRow__input--email"
                    , placeholder "email"
                    , value model.email
                    , onInput EmailInput
                    ]
                    []
                , input
                    [ type_ "password"
                    , class "formRow__input formRow__input--password"
                    , placeholder "password"
                    , value model.password
                    , onInput PasswordInput
                    ]
                    []
                , div [ class "form-group" ]
                    [ label [] []
                    , button
                        [ type_ "submit"
                        , class "btn btn--white formRow--btn"
                        ]
                        [ text "login" ]
                    ]
                ]
            ]
        ]


errorPanel : Maybe String -> Html a
errorPanel error =
    case error of
        Nothing ->
            text ""

        Just msg ->
            div [ class "error" ]
                [ text msg ]



-- subscriptions


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ userLoggedIn UserLoggedIn ]



-- ports


port fetchingUser : String -> Cmd msg


port userLoggedIn : (String -> msg) -> Sub msg
