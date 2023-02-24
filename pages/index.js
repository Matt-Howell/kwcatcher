import Head from 'next/head'
import { Flex, Table, Thead, Tbody, Tr, Th, Td, Text, TableCaption, TableContainer, Button, Input, IconButton, Spinner, useToast, Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  PopoverAnchor,
  List,
  ListItem,
  ListIcon,
  OrderedList,
  UnorderedList,
  Link,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
  StatHelpText,
  StatNumber,
  StatLabel,
  Stat,
  StatArrow,
  useColorModeValue,
  Switch,
  NumberInput,
  NumberInputField,
  Tooltip as ChakraTT,
  Box
} from '@chakra-ui/react'
import { HiOutlinePlusCircle, HiOutlineMagnifyingGlassPlus, HiOutlineArrowTopRightOnSquare, HiOutlineArrowTrendingUp } from 'react-icons/hi2'
import { GiArcheryTarget } from 'react-icons/gi'
import { useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import Footer from '../components/Footer.jsx'
import { FaArrowRight, FaChartBar, FaExternalLinkAlt, FaLeaf, FaMinusSquare, FaPercentage, FaPlus, FaPlusCircle, FaPlusSquare, FaTape } from 'react-icons/fa'
import { RxLetterCaseCapitalize } from 'react-icons/rx'
import { AiOutlineQuestionCircle } from 'react-icons/ai'
import { saveAs } from 'file-saver';

export default function Home() { 
  const volumeMin = useRef(0)
  const volumeMax = useRef(0)

  const lengthMin = useRef(0)
  const lengthMax = useRef(0)

  const scoreMin = useRef(0)
  const scoreMax = useRef(0)

  const includeWords = useRef("")
  const excludeWords = useRef("")

  const inputBox = useRef("")
  const toast = useToast()

  async function postData(url, val) {
    const response = await fetch("http://localhost:4242"+url+val)
    return response.json()
  }

  const [kwsFinal, setKwsFinal] = useState([])
  const [kwsReserved, setKwsReserved] = useState([])
  const [kwLoading, setKwLoading] = useState(false)
  const [showAllWords, setShowAllWords] = useState(false)
  const [loadingWords, setLoadingWords] = useState([{}])

  const [wordsFiltered, setWordsFiltered] = useState([])
  
  const [filteredByWords, setFilteredByWords] = useState([])

  const fetchKWs = async () => {
    setKwLoading(true)
    setFiltersActive([])
    setWordsFiltered([])
    setFilteredByWords([])
    let seed = inputBox.current.value
    let allKws = []
    postData("/get-kws?seed=", seed).then((data) => {
      console.log(data)
      data.keywords.forEach((elem) => {
        allKws.push({ kw:elem, vol:"-", trend:"-", serp:null })
      })
      setKwsFinal(allKws)
      setKwsReserved(allKws)
      setKwLoading(false)

      let kws = []
      allKws.forEach((el) => {
        let newKW = el.kw.replace("how to ", "").replace("best ", "").replace("what ", "").replace("in ", "").replace("a ", "").replace("and ", "").replace("a ", "").replace("i ", "")
        newKW.split(" ").forEach((elem) => {
          kws.push(elem)
        })
      })
      let kwsset = [...new Set(kws)];
      let kwsWLen = []
      kwsset.forEach((el) => {
        if(kws.filter(function(item){ return item === el; }).length > 3){
          kwsWLen.push({ kw: el, occ: kws.filter(function(item){ return item === el; }).length })
        }
      })
      setLoadingWords(kwsWLen.sort((a, b) => b.occ - a.occ))
    });
  }

  const addPAA = (paa) => {
    setKwsFinal([{kw: paa.toLowerCase(), vol:"-", trend:"-", serp:null}, ...kwsFinal])
    setKwsReserved([{kw: paa.toLowerCase(), vol:"-", trend:"-", serp:null}, ...kwsReserved])
  }
  
  const fetchSERP = async (kw, index) => {
    toast({
      title: 'Fetching SERP Data',
      description: "Getting this data for a keyword usually takes just a few seconds, hang tight!",
      status: 'loading',
      isClosable: true,
      duration:30000,
      position: "top-right",
    })
    postData("/analyse-kw?seed=", kw).then((data) => {
      console.log(data)
      let kwsFinalCut = kwsFinal
      let dataVol = []
      let volTotal = 0
      data.vol[1].forEach((element) => {
        volTotal += element.search_volume
        dataVol.push({ month:String(element.month+"/"+String(element.year).substring(2, 4)), searches:element.search_volume })
      })
      let volIncrease = volTotal/data.vol[1].length
      console.log(volIncrease)
      kwsFinalCut[index] = { kw:kw, vol:String(data.vol[0]), trend:dataVol.reverse(), volAvg:volIncrease, serp:data.serp }
      setKwsFinal([...kwsFinalCut])
      let tempKwsReserved = kwsReserved
      tempKwsReserved[tempKwsReserved.findIndex(item => item.kw === kw)] = { kw:kw, vol:String(data.vol[0]), trend:dataVol.reverse(), volAvg:volIncrease, serp:data.serp }
      setKwsReserved([...tempKwsReserved])
      toast.closeAll()
    });
  }

  function filterByWords(word, func){
    if(func == "remove") {  
      let wordsFilteredTemp = wordsFiltered.filter(e => e !== word)
      setWordsFiltered(wordsFiltered.filter(e => e !== word))
      setFilteredByWords(kwsReserved.filter(value => wordsFilteredTemp.every(element => value.kw.includes(element))))
    } else { 
      let wordsFilteredTemp = [...wordsFiltered, word]
      setWordsFiltered(wordsFilteredTemp)
      setFilteredByWords(kwsFinal.filter(value => wordsFilteredTemp.every(element => value.kw.includes(element))))
    }
  }

  // filters other than wrds

  const [filtersActive, setFiltersActive] = useState([])

  useEffect(() => {
    let kwsF = kwsReserved;

    if(filtersActive.includes("length")){
      console.log(lengthMin.current.value, lengthMax.current.value)
      if (lengthMin.current.value && lengthMax.current.value) {
        kwsF = kwsF.filter(value => value.kw.split(" ").length >= lengthMin.current.value && value.kw.split(" ").length <= lengthMax.current.value)
      } else if (lengthMin.current.value) {
        kwsF = kwsF.filter(value => value.kw.split(" ").length >= lengthMin.current.value)
      } else if (lengthMax.current.value) {
        kwsF = kwsF.filter(value => value.kw.split(" ").length <= lengthMax.current.value)
      }
      if (!(lengthMin.current.value) && !(lengthMax.current.value)) {
        setFiltersActive(filtersActive.filter(item => item !== "length"))
      }
    }

    if(filtersActive.includes("volume")){
      console.log(volumeMin.current.value, volumeMax.current.value)
      if (volumeMin.current.value && volumeMax.current.value) {
       kwsF = kwsF.filter(value => value.vol >= volumeMin.current.value && value.vol <= volumeMax.current.value)
      } else if (volumeMin.current.value) {
       kwsF = kwsF.filter(value => value.vol >= volumeMin.current.value)
      } else if (volumeMax.current.value) {
       kwsF = kwsF.filter(value => value.vol <= volumeMax.current.value)
      }
      if (!(volumeMin.current.value) && !(volumeMax.current.value)) {
        setFiltersActive(filtersActive.filter(item => item !== "volume"))
      }
    }

    if (filtersActive.includes("high-intent")) {
      kwsF = kwsF.filter(value => ["best", "review", "top", "find", "buy", "how much", "price", "discount", "top", "order", "coupon", "shop"].some(el => value.kw.split(" ").includes(el)))
    }
    if (filtersActive.includes("informative")) {
      kwsF = kwsF.filter(value => ["how", "what", "why"].some(el => value.kw.split(" ").includes(el)))
    }
    if (filtersActive.includes("comparison")) {
      kwsF = kwsF.filter(value => ["better", "worse", "difference", "comparison", "compare", "vs", "versus", "cheaper", "expensive", "newer", "older"].some(el => value.kw.split(" ").includes(el)))
    }
    if (filtersActive.includes("question")) {
      kwsF = kwsF.filter(value => ["?", "where", "when", "who", "how"].some(el => value.kw.split(" ").includes(el)))
    }

    if (filtersActive.includes("trending")) {
      kwsF = kwsF.filter(value => value.vol > 0).filter(value => value.vol > value.volAvg)
    }

    if (filtersActive.includes("seasonal")) {
      kwsF = kwsF.filter(value => value.vol > 0).filter((value) => {
        let tols = 0
        for (let i = 0; i < value.trend.length; i++) {
          if (value.trend[i].searches > value.volAvg) {
            tols += 1
          }
        } 
        if (tols > 2) {
          return true
        } else {
          return false
        }
      })
    }

    if (filtersActive.includes("score")) {
      if (scoreMin.current.value && scoreMax.current.value) {
        kwsF = kwsF.filter(value => value.serp != null).filter(value => value.serp.score >= scoreMin.current.value && value.serp.score <= scoreMax.current.value)
       } else if (scoreMin.current.value) {
        kwsF = kwsF.filter(value => value.serp != null).kwsF.filter(value => value.vol >= scoreMin.current.value)
       } else if (scoreMax.current.value) {
        kwsF = kwsF.filter(value => value.serp != null).kwsF.filter(value => value.vol <= scoreMax.current.value)
       }
       if (!(scoreMin.current.value) && !(scoreMax.current.value)) {
         setFiltersActive(filtersActive.filter(item => item !== "score"))
       }
    }

    if (filtersActive.includes("include")) {
      console.log(includeWords.current.value.split(","))
      if (includeWords.current.value.length > 0) {
        kwsF = kwsF.filter(value => includeWords.current.value.split(",").some(element => value.kw.includes(element.trim())))
      } else {
        setFiltersActive(filtersActive.filter(item => item !== "include"))
      }
    }

    if (filtersActive.includes("exclude")) {
      console.log(excludeWords.current.value.split(","))
      if (excludeWords.current.value.length > 0) {
        kwsF = kwsF.filter(value => excludeWords.current.value.split(",").every(element => !value.kw.includes(element.trim())))
      } else {
        setFiltersActive(filtersActive.filter(item => item !== "exclude"))
      }
    }

    setKwsFinal(kwsF)
  }, [filtersActive])

  // remove fitler

  function removeFilter(filter){
    setFiltersActive(filtersActive.filter(item => item !== filter))
  }

  const saveToCSV = () => {
    let dataString = "Keyword,Search Volume,Trend,SERP Score,\n\n"+kwsFinal.map(u => `${u.kw},${u.serp ? u.vol : "N/A"},${u.serp ? u.trend[u.trend.length - 1].searches - u.volAvg > 0 ? "Up" : "Down" : "N/A"},${u.serp ? u.serp.score : "N/A"}`).join(',\n')
    const blob = new Blob([dataString], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'kwcatcher_export.csv');
  }

  const popBack = useColorModeValue("#fafafa", "rgb(35, 35, 35)")
  
  return (
    <div>
      <Head>
        <title>Keyword Catcher</title>
        <meta name="description" content="Keyword Catcher" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <Header />
      <Flex as="main" mx="auto" mt={6} px={5}>
        <Flex flexDirection={"column"} w={"100%"} minHeight="100vh" mx="auto" maxWidth={"1200px"}>
        <Flex flexDirection={"column"}>
          <Input ref={inputBox} mt={6} placeholder='Seed Keyword' />
          <Button px={2} onClick={fetchKWs} mb={5} mt={3} maxWidth={"250px"} colorScheme="blue" leftIcon={<HiOutlinePlusCircle size={20} />} fontSize="md">Generate Keywords</Button>
          {kwsReserved.length > 0 ? <Flex mb={12} flexDirection="column"><Flex flexWrap="wrap">
           <Popover placement='bottom-start'>
            <PopoverTrigger>
              <Button mb={{ base:2, md:0 }} leftIcon={<RxLetterCaseCapitalize />} size="sm" mr={3} variant={"outline"}>
                Words
              </Button>
            </PopoverTrigger>
            <PopoverContent minWidth={{ base:"300px", md:"500px", lg:"750px", xl:"1200px" }} backgroundColor={popBack}>
              <PopoverArrow backgroundColor={popBack} />
              <PopoverHeader display={"flex"} alignItems="center"><Flex alignItems="center" justifyContent={"space-between"} width="100%" fontWeight={600} p={1}><Flex justifyContent={"start"} alignItems="center">Filter Words <ChakraTT label='Filter keywords by selecting individual words they must contain - multiple can be selected.' placement='right'><Box as="span" ml={2}><AiOutlineQuestionCircle /></Box></ChakraTT></Flex> <PopoverCloseButton display={"flex"} position="inherit" /></Flex></PopoverHeader>
              <PopoverBody p={0}>
                <Flex flexWrap={"wrap"} p={3} width="100%" backgroundColor={popBack} borderRadius={5}>
                {showAllWords ? <>
                  {loadingWords.map((elem,index,array) => <Button key={index} opacity={wordsFiltered.includes(elem.kw) ? 0.8 : 1} onClick={wordsFiltered.includes(elem.kw) ? () => filterByWords(elem.kw, "remove") : () => filterByWords(elem.kw, "add")} p={0} mb={2} mx={1}><Badge textTransform={"capitalize"} minHeight={"40px"} alignItems="center" display={"flex"} py={2} px={4} rounded="base">{elem.kw}<Text as="span" fontWeight={"bold!important"} ml={1}>({elem.occ})</Text></Badge></Button>)}
                  <Button onClick={() => setShowAllWords(false)} p={0} mb={2} mx={1}><Badge textTransform={"capitalize"} minHeight={"40px"} fontWeight={"700!important"} alignItems="center" display={"flex"} py={2} px={4} rounded="base">View Less...</Badge></Button>
                  </> 
                : <>
                  {loadingWords.slice(0, 30).map((elem,index,array) => <Button key={index} opacity={wordsFiltered.includes(elem.kw) ? 0.8 : 1} onClick={wordsFiltered.includes(elem.kw) ? () => filterByWords(elem.kw, "remove") : () => filterByWords(elem.kw, "add")} p={0} mb={2} mx={1}><Badge textTransform={"capitalize"} minHeight={"40px"} alignItems="center" display={"flex"} py={2} px={4} rounded="base">{elem.kw}<Text as="span" fontWeight={"bold!important"} ml={1}>({elem.occ})</Text></Badge></Button>)}
                  <Button onClick={() => setShowAllWords(true)} p={0} mb={2} mx={1}><Badge textTransform={"capitalize"} minHeight={"40px"} fontWeight={"700!important"} alignItems="center" display={"flex"} py={2} px={4} rounded="base">View More...</Badge></Button>
                  </>
                }
                </Flex>
              </PopoverBody>
            </PopoverContent>
           </Popover>
           <Popover placement='bottom-start'>
              <PopoverTrigger>
                <Button colorScheme={["high-intent","informative","comparison","question"].some(el => filtersActive.includes(el)) ? "green" : "gray"} mb={{ base:2, md:0 }} leftIcon={<GiArcheryTarget />} size="sm" mr={3} variant={"outline"}>
                Intent
                </Button>
              </PopoverTrigger>
              <PopoverContent backgroundColor={popBack}>
                <PopoverArrow backgroundColor={popBack} />
                <PopoverHeader display={"flex"} alignItems="center">
                  <Flex alignItems="center" justifyContent={"space-between"} width="100%" fontWeight={600} p={1}>
                  Search Intent
                  <PopoverCloseButton display={"flex"} position="inherit" /></Flex></PopoverHeader>
                <PopoverBody p={0}>
                  <Flex flexDirection={"column"} width="100%">
                    <Flex borderBottom={"1px solid"} borderColor={"inherit"} flexDirection={"row"} p={4} width="100%" justifyContent={"space-between"} alignItems="center">
                      <Flex justifyContent={"start"} alignItems="center"><Text fontWeight={500}>High Intent</Text><ChakraTT label='Searches that are likely to result in an action (best, review, top, ...)' placement='right'><Box as="span" ml={2}><AiOutlineQuestionCircle /></Box></ChakraTT></Flex><Switch onChange={(e) => e.target.checked ? setFiltersActive([...new Set([...filtersActive, "high-intent"])]) : setFiltersActive(filtersActive.filter(item => item !== "high-intent"))} />
                    </Flex>
                  </Flex>
                  <Flex flexDirection={"column"} width="100%">
                    <Flex borderBottom={"1px solid"} borderColor={"inherit"} flexDirection={"row"} p={4} width="100%" justifyContent={"space-between"} alignItems="center">
                      <Flex justifyContent={"start"} alignItems="center"><Text fontWeight={500}>Informative</Text><ChakraTT label='Searches that are looking for guides, tutorials, or informative posts (how, what, why, ...)' placement='right'><Box as="span" ml={2}><AiOutlineQuestionCircle /></Box></ChakraTT></Flex><Switch onChange={(e) => e.target.checked ? setFiltersActive([...new Set([...filtersActive, "informative"])]) : setFiltersActive(filtersActive.filter(item => item !== "informative"))} />
                    </Flex>
                  </Flex>
                  <Flex flexDirection={"column"} width="100%">
                    <Flex borderBottom={"1px solid"} borderColor={"inherit"} flexDirection={"row"} p={4} width="100%" justifyContent={"space-between"} alignItems="center">
                      <Flex justifyContent={"start"} alignItems="center"><Text fontWeight={500}>Comparison</Text><ChakraTT label='Searches that are comparing one thing to another (vs, compare, difference, ...)' placement='right'><Box as="span" ml={2}><AiOutlineQuestionCircle /></Box></ChakraTT></Flex><Switch onChange={(e) => e.target.checked ? setFiltersActive([...new Set([...filtersActive, "comparison"])]) : setFiltersActive(filtersActive.filter(item => item !== "comparison"))} />
                    </Flex>
                  </Flex>
                  <Flex flexDirection={"column"} width="100%">
                    <Flex flexDirection={"row"} p={4} width="100%" justifyContent={"space-between"} alignItems="center">
                      <Flex justifyContent={"start"} alignItems="center"><Text fontWeight={500}>Questions</Text><ChakraTT label='Searches that are looking for simple answers, usually featured snippets (is, where, when, ...)' placement='right'><Box as="span" ml={2}><AiOutlineQuestionCircle /></Box></ChakraTT></Flex><Switch onChange={(e) => e.target.checked ? setFiltersActive([...new Set([...filtersActive, "question"])]) : setFiltersActive(filtersActive.filter(item => item !== "question"))} />
                    </Flex>
                  </Flex>
                </PopoverBody>
              </PopoverContent>
            </Popover>
            <Popover placement='bottom-start'>
              <PopoverTrigger>
                <Button colorScheme={filtersActive.includes("length") ? "green" : "gray"} mb={{ base:2, md:0 }} leftIcon={<FaTape />} size="sm" mr={3} variant={"outline"}>
                 Length
                </Button>
              </PopoverTrigger>
              <PopoverContent backgroundColor={popBack}>
                <PopoverArrow backgroundColor={popBack} />
                <PopoverHeader display={"flex"} alignItems="center"><Flex alignItems="center" justifyContent={"space-between"} width="100%" fontWeight={600} p={1}><Flex justifyContent={"start"} alignItems="center">Keyword Length <ChakraTT label='Filter keywords by the number of words they contain.' placement='right'><Box as="span" ml={2}><AiOutlineQuestionCircle /></Box></ChakraTT></Flex><PopoverCloseButton display={"flex"} position="inherit" /></Flex></PopoverHeader>
                <PopoverBody p={4}>
                  <Flex flexDirection={"row"} width="100%">
                    <NumberInput mr={2}>
                      <NumberInputField ref={lengthMin} placeholder='Min' />
                    </NumberInput>
                    <NumberInput>
                      <NumberInputField ref={lengthMax} placeholder='Max' />
                    </NumberInput>
                  </Flex>
                  <Button onClick={() => setFiltersActive([...new Set([...filtersActive, "length"])])} mt={4} mb={1} width="fit-content" rightIcon={<FaArrowRight />} size="md" variant={"solid"} colorScheme="blue">
                    Filter 
                  </Button>
                </PopoverBody>
              </PopoverContent>
            </Popover>
            <Popover placement='bottom-start'>
              <PopoverTrigger>
                <Button colorScheme={filtersActive.includes("volume") ? "green" : "gray"} mb={{ base:2, md:0 }} leftIcon={<FaChartBar />} size="sm" mr={3} variant={"outline"}>
                  Volume
                </Button>
              </PopoverTrigger>
              <PopoverContent backgroundColor={popBack}>
                <PopoverArrow backgroundColor={popBack} />
                <PopoverHeader display={"flex"} alignItems="center"><Flex alignItems="center" justifyContent={"space-between"} width="100%" fontWeight={600} p={1}><Flex justifyContent={"start"} alignItems="center">Keyword Volume <ChakraTT label='Filter keywords by the search volume they recieve. You must analyse the SERP of the keyword to get its volume.' placement='right'><Box as="span" ml={2}><AiOutlineQuestionCircle /></Box></ChakraTT></Flex> <PopoverCloseButton display={"flex"} position="inherit" /></Flex></PopoverHeader>
                <PopoverBody p={4}>
                  <Flex flexDirection={"row"} width="100%">
                    <NumberInput mr={2}>
                      <NumberInputField ref={volumeMin} placeholder='Min' />
                    </NumberInput>
                    <NumberInput>
                      <NumberInputField ref={volumeMax} placeholder='Max' />
                    </NumberInput>
                  </Flex>
                  <Button onClick={() => setFiltersActive([...new Set([...filtersActive, "volume"])])} mt={4} mb={1} width="fit-content" rightIcon={<FaArrowRight />} size="md" variant={"solid"} colorScheme="blue">
                    Filter 
                  </Button>
                </PopoverBody>
              </PopoverContent>
            </Popover>
            <Popover placement='bottom-start'>
              <PopoverTrigger>
                <Button colorScheme={filtersActive.includes("score") ? "green" : "gray"} mb={{ base:2, md:0 }} leftIcon={<FaPercentage />} size="sm" mr={3} variant={"outline"}>
                  SERP Score
                </Button>
              </PopoverTrigger>
              <PopoverContent backgroundColor={popBack}>
                <PopoverArrow backgroundColor={popBack} />
                <PopoverHeader display={"flex"} alignItems="center"><Flex alignItems="center" justifyContent={"space-between"} width="100%" fontWeight={600} p={1}><Flex justifyContent={"start"} alignItems="center">SERP Score <ChakraTT label='Filter keywords by their SERP difficulty score (1/difficult - 5/easy). You must analyse the SERP of the keyword to get its SERP score.' placement='right'><Box as="span" ml={2}><AiOutlineQuestionCircle /></Box></ChakraTT></Flex> <PopoverCloseButton display={"flex"} position="inherit" /></Flex></PopoverHeader>
                <PopoverBody p={4}>
                  <Flex flexDirection={"row"} width="100%">
                    <NumberInput mr={2}>
                      <NumberInputField ref={scoreMin} placeholder='Min' />
                    </NumberInput>
                    <NumberInput>
                      <NumberInputField ref={scoreMax} placeholder='Max' />
                    </NumberInput>
                  </Flex>
                  <Button onClick={() => setFiltersActive([...new Set([...filtersActive, "score"])])} mt={4} mb={1} width="fit-content" rightIcon={<FaArrowRight />} size="md" variant={"solid"} colorScheme="blue">
                    Filter 
                  </Button>
                </PopoverBody>
              </PopoverContent>
            </Popover>
            <Popover placement='bottom-start'>
              <PopoverTrigger>
                <Button mb={{ base:2, md:0 }} leftIcon={<FaPlusSquare />} size="sm" mr={3} variant={"outline"}>
                  Include
                </Button>
              </PopoverTrigger>
              <PopoverContent backgroundColor={popBack}>
                <PopoverArrow backgroundColor={popBack} />
                <PopoverHeader display={"flex"} alignItems="center"><Flex alignItems="center" justifyContent={"space-between"} width="100%" fontWeight={600} p={1}><Flex justifyContent={"start"} alignItems="center">Include Words/Phrases <ChakraTT label='Filter keywords by individual words or phrases that they contain. For multiple, enter them comma seperated.' placement='right'><Box as="span" ml={2}><AiOutlineQuestionCircle /></Box></ChakraTT></Flex> <PopoverCloseButton display={"flex"} position="inherit" /></Flex></PopoverHeader>
                <PopoverBody p={4}>
                  <Flex flexDirection={"row"} width="100%">
                    <Input ref={includeWords} placeholder='Phrases (Comma Seperated)' />
                  </Flex>
                  <Button onClick={() => setFiltersActive([...new Set([...filtersActive, "include"])])} mt={4} mb={1} width="fit-content" rightIcon={<FaArrowRight />} size="md" variant={"solid"} colorScheme="blue">
                    Filter 
                  </Button>
                </PopoverBody>
              </PopoverContent>
            </Popover>
            <Popover placement='bottom-start'>
              <PopoverTrigger>
                <Button mb={{ base:2, md:0 }} leftIcon={<FaMinusSquare />} size="sm" mr={3} variant={"outline"}>
                  Exclude
                </Button>
              </PopoverTrigger>
              <PopoverContent backgroundColor={popBack}>
                <PopoverArrow backgroundColor={popBack} />
                <PopoverHeader display={"flex"} alignItems="center"><Flex alignItems="center" justifyContent={"space-between"} width="100%" fontWeight={600} p={1}><Flex justifyContent={"start"} alignItems="center">Exclude Words/Phrases <ChakraTT label='Filter keywords by individual words or phrases that they do not contain. For multiple, enter them comma seperated.' placement='right'><Box as="span" ml={2}><AiOutlineQuestionCircle /></Box></ChakraTT></Flex> <PopoverCloseButton display={"flex"} position="inherit" /></Flex></PopoverHeader>
                <PopoverBody p={4}>
                  <Flex flexDirection={"row"} width="100%">
                    <Input ref={excludeWords} placeholder='Phrases (Comma Seperated)' />
                  </Flex>
                  <Button onClick={() => setFiltersActive([...new Set([...filtersActive, "exclude"])])} mt={4} mb={1} width="fit-content" rightIcon={<FaArrowRight />} size="md" variant={"solid"} colorScheme="blue">
                    Filter 
                  </Button>
                </PopoverBody>
              </PopoverContent>
            </Popover>
            <Button onClick={() => filtersActive.includes("trending") ? removeFilter("trending") : setFiltersActive([...new Set([...filtersActive, "trending"])])} colorScheme={filtersActive.includes("trending") ? "green" : "gray"} mb={{ base:2, md:0 }} leftIcon={<HiOutlineArrowTrendingUp />} size="sm" mr={3} variant={"outline"}>
              Trending
            </Button>
            <Button onClick={() => filtersActive.includes("seasonal") ? removeFilter("seasonal") : setFiltersActive([...new Set([...filtersActive, "seasonal"])])} colorScheme={filtersActive.includes("seasonal") ? "green" : "gray"} mb={{ base:2, md:0 }} leftIcon={<FaLeaf />} size="sm" mr={3} variant={"outline"}>
              Seasonal
            </Button>
          </Flex></Flex> : null}
        </Flex>
        {kwsFinal.length > 0 ? <Flex width={"100%"} justifyContent="flex-end"><Button width={"fit-content"} size="sm" mb={2} colorScheme={"blue"} variant="outline" rightIcon={<FaExternalLinkAlt />} onClick={saveToCSV}>Export to CSV</Button></Flex> : null}
        <TableContainer maxW="100vw" overflow="auto">
        <Table overflow="auto" style={{ tableLayout:"auto" }} variant='simple'>
          <TableCaption fontFamily={"'Montserrat', sans-serif!important"} mb={15}>{kwLoading ? <Spinner /> : "Fetched Keywords"}</TableCaption>
          <Thead overflow="auto">
            <Tr overflow="auto">
              <Th fontFamily={"'Montserrat', sans-serif!important"}>Keyword</Th>
              <Th fontFamily={"'Montserrat', sans-serif!important"} display={{ base:"none", md:"table-cell" }}>Search Volume</Th>
              <Th fontFamily={"'Montserrat', sans-serif!important"} display={{ base:"none", md:"table-cell" }}>Trend</Th>
              <Th fontFamily={"'Montserrat', sans-serif!important"}>SERP</Th>
            </Tr>
          </Thead>
          <Tbody overflow="auto">
            {wordsFiltered.length == 0 ? kwsFinal.map((elem, index, arr) => <Tr key={index}>{elem.serp != null ? <><Td>{elem.kw}</Td><Td>{elem.vol}</Td><Td><Flex width={"100%"}><AreaChart width={150} height={45} data={elem.trend}><Area type="monotone" dataKey="searches" stroke="#3182ce" fill="#3182ce" /></AreaChart></Flex></Td>
            
            <Popover placement='bottom-end'><Td><PopoverTrigger><Button padding={"0!important"} height={"fit-content"}><Badge minHeight={"40px"} alignItems="center" display={"flex"} colorScheme={elem.serp.score > 3 ? "green" : elem.serp.score > 1 ? "orange" : null} py={2} px={4} rounded="base">{elem.serp.score}</Badge></Button></PopoverTrigger></Td> <PopoverContent width={"100%"}>
            
            <Tabs isFitted mt={2}>
              <TabList>
                <Tab>SERP</Tab>
                <Tab>Volume</Tab>
                <Tab>PAA</Tab>
                <Tab>Snippet</Tab>
              </TabList>      
              <PopoverBody px={6} whiteSpace={"pre-wrap"}>
                <TabPanels>
                  <TabPanel py={0} px={2}>
                    <Flex mt={2} mb={4}><Badge ml={2} px={2} py={1} textTransform="normal" variant={"outline"} colorScheme={elem.serp.score > 3 ? "green" : elem.serp.score > 1 ? "orange" : "red"} rounded="base">Difficulty: {elem.serp.score > 3 ? "Easy" : elem.serp.score > 1 ? "Medium" : "Hard"}</Badge><Badge textTransform="normal" ml={2} py={1} px={2} rounded="base">Avg Words: {elem.serp.avgWc}</Badge><Link href={"https://google.com/search?q="+elem.kw} textDecoration="none" _hover={{ textDecoration:"none", opacity:0.8 }} target="_blank"><Badge textTransform="normal" display={"flex"} alignItems="center" ml={2} py={1} px={2} rounded="base" as={"button"}>Open SERP <HiOutlineArrowTopRightOnSquare size={15} style={{ marginLeft:"0.25rem" }} /></Badge></Link></Flex><OrderedList>{elem.serp.results.map((el, i, ar) => <ListItem key={i} className='boldList'><Flex flexDirection={"column"}><Flex alignItems={"center"}>{el.title.substring(0, 45)}...<Badge textTransform="normal" ml={2} px={2} rounded="base">{el.wc} Words</Badge></Flex><Link color={"blue.300"} href={el.url}>{el.url.length > 55 ? el.url.substring(0, 55) + "..." : el.url.substring(0, 55)}</Link></Flex></ListItem>)}</OrderedList>
                  </TabPanel>
                  <TabPanel p={0} px={2}>
                    <Text my={3} fontWeight={500}>Volume from {elem.trend[0].month} to {elem.trend[elem.trend.length - 1].month}</Text>
                    <Stat>
                      <StatLabel>Monthly Volume</StatLabel>
                      <StatNumber>{elem.vol}</StatNumber>
                      <StatHelpText>
                        <StatArrow type={elem.vol == 0 ? "increase" : elem.vol > elem.volAvg ? "increase" : "decrease"} />
                        {elem.vol == 0 ? "0.00" : String((((elem.volAvg - elem.vol) / elem.volAvg) * 100).toFixed(2)).replace("-", "")}%
                      </StatHelpText>
                    </Stat>
                    <Flex borderTop={"1px solid #EDF2F7"} my={3} pt={4}>
                      <AreaChart
                        width={400}
                        height={300}
                        data={elem.trend}
                      >
                        <XAxis dataKey="month" hide />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" legendType='none' dataKey="searches" stroke="#3182ce" fill="#3182ce" />
                      </AreaChart>
                    </Flex>
                  </TabPanel>
                  <TabPanel py={0} px={2}>
                    <Flex mt={2} mb={4}>
                      <OrderedList>
                        {elem.serp.queries.map((el, i, ar) => 
                          <ListItem key={i} className='boldList' mb={2}>
                            <Flex flexDirection={"row"}>
                              <Flex alignItems={"center"}>{el}</Flex>
                              <Button width={"fit-content"} ml={3} py={0} leftIcon={<FaPlusCircle />} onClick={() => addPAA(el)} size="sm">Add</Button>
                            </Flex>
                          </ListItem>
                        )}
                      </OrderedList>
                    </Flex>
                  </TabPanel>
                  <TabPanel py={0} px={2}>
                    <Flex mt={2} mb={4} flexDirection="column">
                      {elem.serp.snippet != null ? <><Text fontWeight={600}>Title: <Text fontWeight={500} as="span">{elem.serp.snippet.title}</Text></Text><Text fontWeight={600}>Link: <Link href={elem.serp.snippet.url} color={"blue.300"} fontWeight={500}>{elem.serp.snippet.url.substring(0,35)}...</Link></Text></> : <Text fontWeight={600}>No Snippet in SERP</Text>}
                    </Flex>
                  </TabPanel>
                </TabPanels>
              </PopoverBody>
            </Tabs>
              </PopoverContent></Popover></> : <><Td>{elem.kw}</Td><Td display={{ base:"none", md:"table-cell" }}>0</Td><Td display={{ base:"none", md:"table-cell" }}>{elem.vol}</Td><Td><IconButton onClick={() => fetchSERP(elem.kw, index)} icon={<HiOutlineMagnifyingGlassPlus />} background="transparent" /></Td></>}</Tr>)

            :

            filteredByWords.map((elem, index, arr) => <><Tr key={index}>{elem.serp != null ? <><Td>{elem.kw}</Td><Td>{elem.vol}</Td><Td><Flex width={"100%"}><AreaChart width={150} height={45} data={elem.trend}><Area type="monotone" dataKey="searches" stroke="#3182ce" fill="#3182ce" /></AreaChart></Flex></Td><Popover placement='bottom-end'><Td><PopoverTrigger><Button padding={"0!important"} height={"fit-content"}><Badge minHeight={"40px"} alignItems="center" display={"flex"} colorScheme={elem.serp.score > 3 ? "green" : elem.serp.score > 1 ? "orange" : null} py={2} px={4} rounded="base">{elem.serp.score}</Badge></Button></PopoverTrigger></Td> <PopoverContent width={"100%"}><PopoverArrow />
            
            <Tabs isFitted mt={2}>
              <TabList>
                <Tab>SERP</Tab>
                <Tab>Volume</Tab>
                <Tab>PAA</Tab>
                <Tab>Snippet</Tab>
              </TabList>      
              <PopoverBody px={6} whiteSpace={"pre-wrap"}>
                <TabPanels>
                  <TabPanel py={0} px={2}>
                    <Flex mt={2} mb={4}><Badge ml={2} px={2} py={1} textTransform="normal" variant={"outline"} colorScheme={elem.serp.score > 3 ? "green" : elem.serp.score > 1 ? "orange" : "red"} rounded="base">Difficulty: {elem.serp.score > 3 ? "Easy" : elem.serp.score > 1 ? "Medium" : "Hard"}</Badge><Badge textTransform="normal" ml={2} py={1} px={2} rounded="base">Avg Words: {elem.serp.avgWc}</Badge><Link href={"https://google.com/search?q="+elem.kw} textDecoration="none" _hover={{ textDecoration:"none", opacity:0.8 }} target="_blank"><Badge textTransform="normal" display={"flex"} alignItems="center" ml={2} py={1} px={2} rounded="base" as={"button"}>Open SERP <HiOutlineArrowTopRightOnSquare size={15} style={{ marginLeft:"0.25rem" }} /></Badge></Link></Flex><OrderedList>{elem.serp.results.map((el, i, ar) => <ListItem key={i} className='boldList'><Flex flexDirection={"column"}><Flex alignItems={"center"}>{el.title.substring(0, 45)}...<Badge textTransform="normal" ml={2} px={2} rounded="base">{el.wc} Words</Badge></Flex><Link color={"blue.300"} href={el.url}>{el.url.length > 55 ? el.url.substring(0, 55) + "..." : el.url.substring(0, 55)}</Link></Flex></ListItem>)}</OrderedList>
                  </TabPanel>
                  <TabPanel p={0} px={2}>
                    <Text my={3} fontWeight={500}>Volume from {elem.trend[0].month} to {elem.trend[elem.trend.length - 1].month}</Text>
                    <Stat>
                      <StatLabel>Monthly Volume</StatLabel>
                      <StatNumber>{elem.vol}</StatNumber>
                      <StatHelpText>
                        <StatArrow type={elem.vol == 0 ? "increase" : elem.vol > elem.volAvg ? "increase" : "decrease"} />
                        {elem.vol == 0 ? "0.00" : String((((elem.volAvg - elem.vol) / elem.volAvg) * 100).toFixed(2)).replace("-", "")}%
                      </StatHelpText>
                    </Stat>
                    <Flex borderTop={"1px solid #EDF2F7"} my={3} pt={4}>
                      <AreaChart
                        width={400}
                        height={300}
                        data={elem.trend}
                      >
                        <XAxis dataKey="month" hide />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" legendType='none' dataKey="searches" stroke="#3182ce" fill="#3182ce" />
                      </AreaChart>
                    </Flex>
                  </TabPanel>
                  <TabPanel py={0} px={2}>
                    <Flex mt={2} mb={4}>
                      <OrderedList>{elem.serp.queries.map((el, i, ar) => <ListItem key={i} className='boldList'><Flex flexDirection={"column"}><Flex alignItems={"center"}>{el}</Flex></Flex></ListItem>)}</OrderedList>
                    </Flex>
                  </TabPanel>
                  <TabPanel py={0} px={2}>
                    <Flex mt={2} mb={4} flexDirection="column">
                      {elem.serp.snippet != null ? <><Text fontWeight={600}>Title: <Text fontWeight={500} as="span">{elem.serp.snippet.title}</Text></Text><Text fontWeight={600}>Link: <Link href={elem.serp.snippet.url} color={"blue.300"} fontWeight={500}>{elem.serp.snippet.url.substring(0,35)}...</Link></Text></> : <Text fontWeight={600}>No Snippet in SERP</Text>}
                    </Flex>
                  </TabPanel>
                </TabPanels>
              </PopoverBody>
            </Tabs>
              </PopoverContent></Popover></> : <><Td>{elem.kw}</Td><Td display={{ base:"none", md:"table-cell" }}>0</Td><Td display={{ base:"none", md:"table-cell" }}>{elem.vol}</Td><Td><IconButton onClick={() => fetchSERP(elem.kw, index)} icon={<HiOutlineMagnifyingGlassPlus />} background="transparent" /></Td></>}</Tr></>)}
          </Tbody>
          </Table>
        </TableContainer>
        </Flex>
      </Flex>
      <Footer />
    </div>
  )
}
