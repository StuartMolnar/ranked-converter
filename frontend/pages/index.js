import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { CssBaseline, Container, Typography, Box, ToggleButton, ToggleButtonGroup, FormControl, InputLabel, Select, MenuItem, Button, Card, CardContent, ThemeProvider, createTheme } from '@mui/material';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frhaablrjokjfjszifpj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyaGFhYmxyam9ramZqc3ppZnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTA3MDk3NjYsImV4cCI6MjAwNjI4NTc2Nn0.RTDMgNx9MoWem_bbhOlVN5XGVNu8JA1khB9oF9CFXOw';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
  typography: {
    fontFamily: 'Roboto',
  },
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
  typography: {
    fontFamily: 'Roboto',
  },
});

export default function Home() {
  const [game, setGame] = useState('League of Legends');
  const [rank, setRank] = useState('');
  const [convertedRank, setConvertedRank] = useState('');
  const [convertedRankPercentile, setConvertedRankPercentile] = useState(0);
  const [currentPercentile, setCurrentPercentile] = useState(0);
  const [equivalentRankPercentile, setEquivalentRankPercentile] = useState(0);
  
  const [allRanks, setAllRanks] = useState({
    "League of Legends": [],
    "Valorant": []
  });

  useEffect(() => {
    const fetchRanks = async () => {
      let { data: leagueRanks, error: leagueError } = await supabase
        .from('League_Ranks')
        .select('tier, cumulative_percentile')
        .order('cumulative_percentile', { ascending: true });
  
      let { data: valorantRanks, error: valorantError } = await supabase
        .from('Valorant_Ranks')
        .select('tier, cumulative_percentile')
        .order('cumulative_percentile', { ascending: true });

      if (leagueError || valorantError) {
        console.error('Error fetching data:', leagueError || valorantError);
        return;
      }
  
      setAllRanks({
        "League of Legends": leagueRanks,
        "Valorant": valorantRanks
      });
    };
  
    fetchRanks();
  }, []);

  const handleGameChange = (event, newGame) => {
    setGame(newGame);
    setRank('');
  };

  const handleGameChangeAndReset = (event, newGame) => {
    handleGameChange(event, newGame);
    setConvertedRank('');
    setConvertedRankPercentile(0);
  };
  

  const handleRankChange = (event) => {
    setRank(event.target.value);
  };

  const handleConvert = () => {
  const selectedRank = allRanks[game].find(rankObj => rankObj.tier === rank);
  if (!selectedRank) {
    console.error('Selected rank not found');
    return;
  }

  const otherGame = game === 'League of Legends' ? 'Valorant' : 'League of Legends';
  const equivalentRank = allRanks[otherGame].find(rankObj => rankObj.cumulative_percentile >= selectedRank.cumulative_percentile);

  const equivalentRankIndex = allRanks[otherGame].indexOf(equivalentRank);

  const isLastRank = equivalentRankIndex === allRanks[otherGame].length - 1;

  const lowerRank = equivalentRankIndex > 0 ? allRanks[otherGame][equivalentRankIndex - 1] : null;

  let equivalentRankPercentile = 100; 
  if (!isLastRank && lowerRank) {
    equivalentRankPercentile = ((selectedRank.cumulative_percentile - lowerRank.cumulative_percentile) / (equivalentRank.cumulative_percentile - lowerRank.cumulative_percentile)) * 100;
  }

  setConvertedRank(equivalentRank ? equivalentRank.tier : "No equivalent rank");
  setConvertedRankPercentile(equivalentRank ? parseFloat(equivalentRank.cumulative_percentile).toFixed(2) : "100");
  setCurrentPercentile(parseFloat(selectedRank.cumulative_percentile).toFixed(2));
  setEquivalentRankPercentile(parseFloat(equivalentRankPercentile).toFixed(2));
};


  return (
    <>
      <Head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:200,400,500&display=swap" />
      </Head>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline>
          <Container sx={{
            height: '90vh',
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center' 
          }}>
            
            <ThemeProvider theme={lightTheme}>
              <Typography sx={{color: '#FAF9F6'}} variant="h4" component="h1" gutterBottom align="center">
                Ranked Converter
              </Typography>
              <Card sx={{bgcolor: '#FAF9F6'}}>
                <CardContent>
                  <Box sx={{ my: 2 }}>
                  <ToggleButtonGroup
                    value={game}
                    exclusive
                    onChange={handleGameChangeAndReset}
                    aria-label="game selection"
                  >
                    <ToggleButton value="League of Legends" aria-label="League of Legends" disabled={game === "League of Legends"}>
                      League of Legends
                    </ToggleButton>
                    <ToggleButton value="Valorant" aria-label="Valorant" disabled={game === "Valorant"}>
                      Valorant
                    </ToggleButton>
                  </ToggleButtonGroup>
                  </Box>
                  <Box sx={{ my: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel id="rank-label">{game} Rank</InputLabel>
                      <Select
                        labelId="rank-label"
                        value={rank}
                        onChange={handleRankChange}
                        onOpen={() => {
                          setConvertedRank('');
                          setConvertedRankPercentile(0);
                        }}
                        label={`${game} Rank`}
                      >
                        {allRanks[game].map((rank) => (
                          <MenuItem key={rank.tier} value={rank.tier}>
                            {rank.tier}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ my: 2 }}>
                    <Button variant="contained" onClick={handleConvert} fullWidth>
                      Convert
                    </Button>
                  </Box>
                  {convertedRank && (
                    <Typography component="div" align="center" variant="body1">
                      {!(rank === allRanks['League of Legends'][allRanks['League of Legends'].length - 1].tier || rank === allRanks['Valorant'][allRanks['Valorant'].length - 1].tier) ? (
                        <>
                          <Box mb={1}> <Typography variant="h6" component="span">{rank}</Typography> in {game === 'League of Legends' ? 'League' : 'Valorant'} is the top <Typography variant="h6" component="span">{currentPercentile}%</Typography></Box>
                          <Box mb={1}><Typography variant="h6" component="span">{convertedRank}</Typography> in {game === 'League of Legends' ? 'Valorant': 'League'} is the top <Typography variant="h6" component="span">{convertedRankPercentile}%</Typography></Box>
                          <Box>So {game === 'League of Legends' ? 'League' : 'Valorant'} <Typography variant="h6" component="span">{rank}</Typography> is equivelant to the <Typography variant="h6" component="span">top {equivalentRankPercentile}%</Typography> of {game === 'League of Legends' ? 'Valorant': 'League'} <Typography variant="h6" component="span">{convertedRank}</Typography></Box>
                        </>
                      ) : (
                        <Box>{rank} is the lowest rank.</Box>
                      )}
                    </Typography>                  
                  )}
                </CardContent>
              </Card>
            </ThemeProvider>
          </Container>
        </CssBaseline>
      </ThemeProvider>
    </>
  );
}
