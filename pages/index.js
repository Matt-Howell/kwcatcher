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
  StatArrow
} from '@chakra-ui/react'
import { HiOutlinePlusCircle, HiOutlineMagnifyingGlassPlus, HiOutlineArrowTopRightOnSquare } from 'react-icons/hi2'
import { useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';


export default function Home() { 

  const inputBox = useRef("")
  const toast = useToast()

  async function postData(url, val) {
    const response = await fetch("http://localhost:4242"+url+val)
    return response.json()
  }

  const [kwsFinal, setKwsFinal] = useState([])
  const [kwLoading, setKwLoading] = useState(false)

  const fetchKWs = async () => {
    setKwLoading(true)
    let seed = inputBox.current.value
    let allKws = []
    postData("/get-kws?seed=", seed).then((data) => {
      console.log(data)
      data.keywords.forEach((elem) => {
        allKws.push({ kw:elem, vol:"-", trend:"-", serp:null, related:false })
      })
      setKwsFinal(allKws)
      setKwLoading(false)
    });
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
      // for (let i = 0; i < data.serp.queries.length; i++) {
      //   let query = data.serp.queries[i].toLowerCase();
      //   console.log(index, index+i)
      //   kwsFinalCut.splice(i+index, 0, { kw:query, vol:"-", trend:"-", serp:null, related:true })
      // }
      let dataVol = []
      let volTotal = 0
      data.vol[1].forEach((element) => {
        volTotal += element.search_volume
        dataVol.push({ month:String(element.month+"/"+element.year), searches:element.search_volume })
      })
      let volIncrease = volTotal/data.vol[1].length
      console.log(volIncrease)
      kwsFinalCut[index] = { kw:kw, vol:String(data.vol[0]), trend:dataVol.reverse(), volAvg:volIncrease, serp:data.serp, related:false }
      setKwsFinal([...kwsFinalCut])
      toast.closeAll()
    });
  }

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
        <Input ref={inputBox} mt={6} placeholder='Seed Keyword' />
        <Button px={2} onClick={fetchKWs} mb={8} mt={3} maxWidth={"250px"} colorScheme="blue" leftIcon={<HiOutlinePlusCircle size={20} />} fontSize="md">Generate Keywords</Button>
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
            {kwsFinal.map((elem, index, arr) => <Tr key={index}>{elem.serp != null ? <><Td>{elem.kw}{elem.related == true ? <Badge colorScheme={"blue"} py={1} px={1} ml={2} rounded="base">Related</Badge> : null}</Td><Td>{elem.vol}</Td><Td><Flex width={"100%"}><AreaChart width={150} height={45} data={elem.trend}><Area type="monotone" dataKey="searches" stroke="#3182ce" fill="#3182ce" /></AreaChart></Flex></Td><Popover><Td><PopoverTrigger><Button padding={"0!important"} height={"fit-content"}><Badge minHeight={"40px"} alignItems="center" display={"flex"} colorScheme={elem.serp.score > 3 ? "green" : elem.serp.score > 1 ? "orange" : null} py={2} px={4} rounded="base">{elem.serp.score}</Badge></Button></PopoverTrigger></Td> <PopoverContent width={"100%"}><PopoverArrow />
            
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
              </PopoverContent></Popover></> : <><Td>{elem.kw}{elem.related == true ? <Badge colorScheme={"yellow"} px={1} ml={2} rounded="base" textTransform={"none"}>Related</Badge> : null}</Td><Td display={{ base:"none", md:"table-cell" }}>0</Td><Td display={{ base:"none", md:"table-cell" }}>{elem.vol}</Td><Td><IconButton onClick={() => fetchSERP(elem.kw, index)} icon={<HiOutlineMagnifyingGlassPlus />} background="transparent" /></Td></>}</Tr>)}
          </Tbody>
          </Table>
        </TableContainer>
        </Flex>
      </Flex>
    </div>
  )
}
